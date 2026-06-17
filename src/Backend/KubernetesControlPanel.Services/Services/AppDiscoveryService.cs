using k8s;
using k8s.Models;
using KubernetesControlPanel.Core.Configuration;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KubernetesControlPanel.Services.Services;

public class AppDiscoveryService : IAppDiscoveryService
{
    private static readonly string[] AccentPalette =
    {
        "#2563eb", "#7c3aed", "#db2777", "#059669", "#d97706", "#0891b2", "#4f46e5", "#be123c"
    };

    private readonly IKubernetes _kubernetesClient;
    private readonly KubernetesConfig _config;
    private readonly AppUrlResolver _urlResolver;
    private readonly ILogger<AppDiscoveryService> _logger;

    public AppDiscoveryService(
        IKubernetes kubernetesClient,
        IOptions<KubernetesConfig> config,
        AppUrlResolver urlResolver,
        ILogger<AppDiscoveryService> logger)
    {
        _kubernetesClient = kubernetesClient;
        _config = config.Value;
        _urlResolver = urlResolver;
        _logger = logger;
    }

    public async Task<AppListResponse> GetAppsAsync()
    {
        var apps = await DiscoverAppsAsync();
        return new AppListResponse
        {
            Apps = apps,
            Summary = BuildSummary(apps),
            LastUpdated = DateTime.UtcNow
        };
    }

    public async Task<DiscoveredApp?> GetAppAsync(string ns, string appKey)
    {
        var apps = await DiscoverAppsAsync();
        return apps.FirstOrDefault(a =>
            string.Equals(a.Namespace, ns, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(a.AppKey, appKey, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<AppAdminDetail?> GetAppAdminAsync(string ns, string appKey)
    {
        var app = await GetAppAsync(ns, appKey);
        if (app == null) return null;

        var deployments = await _kubernetesClient.AppsV1.ListNamespacedDeploymentAsync(ns);
        var services = await _kubernetesClient.CoreV1.ListNamespacedServiceAsync(ns);
        var ingresses = await _kubernetesClient.NetworkingV1.ListNamespacedIngressAsync(ns);
        var pods = await _kubernetesClient.CoreV1.ListNamespacedPodAsync(ns);
        var events = await _kubernetesClient.CoreV1.ListNamespacedEventAsync(ns);

        var appDeployments = deployments.Items
            .Where(d => app.Components.Any(c =>
                c.Type == "Deployment" && string.Equals(c.Name, d.Metadata?.Name, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        var templateLabels = appDeployments
            .Select(d => d.Spec?.Template?.Metadata?.Labels ?? new Dictionary<string, string>())
            .ToList();

        var appPods = pods.Items.Where(p =>
            templateLabels.Any(tl => PodMatchesLabels(p, tl))).ToList();

        var matchedServices = services.Items.Where(s =>
            templateLabels.Any(tl => AppUrlResolver.ServiceMatchesSelector(s, tl))).ToList();

        var matchedIngresses = ingresses.Items.Where(i =>
            i.Spec?.Rules?.Any(r =>
                r.Http?.Paths?.Any(p =>
                    matchedServices.Any(s =>
                        string.Equals(p.Backend?.Service?.Name, s.Metadata?.Name, StringComparison.OrdinalIgnoreCase))) == true) == true
            || matchedServices.Any()).ToList();

        var podInfos = appPods.Select(MapPodInfo).ToList();
        var recentEvents = events.Items
            .Where(e => appPods.Any(p => p.Metadata?.Name == e.InvolvedObject?.Name) ||
                        appDeployments.Any(d => d.Metadata?.Name == e.InvolvedObject?.Name))
            .OrderByDescending(e => e.LastTimestamp ?? e.EventTime)
            .Take(50)
            .Select(MapEvent)
            .ToList();

        var restarts24h = appPods.Sum(p =>
            p.Status?.ContainerStatuses?.Sum(cs => cs.RestartCount) ?? 0);

        var worst = app.Components.FirstOrDefault(c => c.UserStatus is "Offline" or "Degraded");
        var overview = new AppAdminOverview
        {
            Headline = $"{app.DisplayName} is {app.UserStatus}",
            Reason = app.StatusReason ?? AppStatusMapper.BuildStatusReason(appPods, worst?.Name),
            AffectedComponent = worst?.Name,
            RecentWarning = recentEvents.FirstOrDefault(e => e.Type == "Warning")?.Message,
            SuggestedSteps = BuildSuggestedSteps(app, worst?.Name)
        };

        return new AppAdminDetail
        {
            App = app,
            Overview = overview,
            Workloads = appDeployments.Select(MapWorkload).ToList(),
            Pods = podInfos,
            Services = matchedServices.Select(s => MapService(s, appPods)).ToList(),
            Ingresses = MapIngresses(matchedIngresses, matchedServices),
            RecentEvents = recentEvents,
            RestartsLast24Hours = restarts24h
        };
    }

    private async Task<List<DiscoveredApp>> DiscoverAppsAsync()
    {
        var deploymentsTask = _kubernetesClient.AppsV1.ListDeploymentForAllNamespacesAsync();
        var servicesTask = _kubernetesClient.CoreV1.ListServiceForAllNamespacesAsync();
        var ingressesTask = _kubernetesClient.NetworkingV1.ListIngressForAllNamespacesAsync();
        var podsTask = _kubernetesClient.CoreV1.ListPodForAllNamespacesAsync();

        await Task.WhenAll(deploymentsTask, servicesTask, ingressesTask, podsTask);

        var deployments = deploymentsTask.Result.Items;
        var services = servicesTask.Result.Items;
        var ingresses = ingressesTask.Result.Items;
        var pods = podsTask.Result.Items;

        var nodePortHost = await _urlResolver.ResolveNodePortPublicHostAsync(
            services, ingresses,
            async () => (await _kubernetesClient.CoreV1.ListNodeAsync()).Items);

        var servicesByNs = services.GroupBy(s => s.Metadata?.NamespaceProperty ?? "").ToDictionary(g => g.Key, g => g.ToList());
        var ingressesByNs = ingresses.GroupBy(i => i.Metadata?.NamespaceProperty ?? "").ToDictionary(g => g.Key, g => g.ToList());
        var podsByNs = pods.GroupBy(p => p.Metadata?.NamespaceProperty ?? "").ToDictionary(g => g.Key, g => g.ToList());

        var groups = new Dictionary<string, List<V1Deployment>>();

        foreach (var deployment in deployments)
        {
            var ns = deployment.Metadata?.NamespaceProperty ?? "";
            var groupKey = GetGroupKey(deployment);
            var fullKey = $"{ns}|{groupKey}";

            if (!groups.TryGetValue(fullKey, out var list))
            {
                list = new List<V1Deployment>();
                groups[fullKey] = list;
            }
            list.Add(deployment);
        }

        var apps = new List<DiscoveredApp>();

        foreach (var (fullKey, deps) in groups)
        {
            var ns = fullKey.Split('|')[0];
            var groupKey = fullKey[(ns.Length + 1)..];
            servicesByNs.TryGetValue(ns, out var nsServices);
            ingressesByNs.TryGetValue(ns, out var nsIngresses);
            podsByNs.TryGetValue(ns, out var nsPods);
            nsServices ??= new List<V1Service>();
            nsIngresses ??= new List<V1Ingress>();
            nsPods ??= new List<V1Pod>();

            apps.Add(BuildApp(ns, groupKey, deps, nsServices, nsIngresses, nsPods, nodePortHost));
        }

        return apps
            .OrderBy(a => a.IsSystem)
            .ThenBy(a => a.Environment)
            .ThenBy(a => a.DisplayName)
            .ToList();
    }

    private DiscoveredApp BuildApp(
        string ns,
        string groupKey,
        List<V1Deployment> deployments,
        List<V1Service> nsServices,
        List<V1Ingress> nsIngresses,
        List<V1Pod> nsPods,
        string? nodePortHost)
    {
        var allLabels = deployments.SelectMany(d => d.Metadata?.Labels ?? new Dictionary<string, string>())
            .GroupBy(kv => kv.Key).ToDictionary(g => g.Key, g => g.First().Value);

        var allAnnotations = deployments.SelectMany(d => d.Metadata?.Annotations ?? new Dictionary<string, string>());

        var components = new List<AppComponent>();
        var allUrls = new List<AppUrl>();
        var allTemplateLabels = new List<IDictionary<string, string>>();

        foreach (var deployment in deployments)
        {
            var replicas = deployment.Spec?.Replicas ?? 0;
            var ready = deployment.Status?.ReadyReplicas ?? 0;
            var templateLabels = deployment.Spec?.Template?.Metadata?.Labels
                ?? new Dictionary<string, string>();
            allTemplateLabels.Add(templateLabels);

            var depPods = nsPods.Where(p => PodMatchesLabels(p, templateLabels)).ToList();
            var podStatuses = depPods.Select(AppStatusMapper.MapPodUserStatus).ToList();
            var componentUserStatus = podStatuses.Count > 0
                ? AppStatusMapper.AggregateUserStatus(podStatuses)
                : AppStatusMapper.MapDeploymentUserStatus(replicas, ready);

            components.Add(new AppComponent
            {
                Name = deployment.Metadata?.Name ?? "",
                Type = "Deployment",
                UserStatus = componentUserStatus,
                AdminStatus = AppStatusMapper.MapDeploymentAdminStatus(replicas, ready),
                ReadyReplicas = ready,
                TotalReplicas = replicas
            });

            var matchedServices = nsServices.Where(s => AppUrlResolver.ServiceMatchesSelector(s, templateLabels)).ToList();
            foreach (var svc in matchedServices)
            {
                allUrls.AddRange(_urlResolver.BuildUrlsForService(svc, nsIngresses, nodePortHost));
            }
        }

        allUrls = allUrls.GroupBy(u => u.Url).Select(g => g.First()).OrderBy(u => u.Label).ToList();

        var appPods = nsPods.Where(p => allTemplateLabels.Any(tl => PodMatchesLabels(p, tl))).ToList();
        var readyPods = appPods.Count(p => p.Status?.ContainerStatuses?.All(c => c.Ready) == true);
        var componentStatuses = components.Select(c => c.UserStatus);
        var userStatus = AppStatusMapper.AggregateUserStatus(componentStatuses);
        var adminStatuses = components.Select(c => c.AdminStatus);
        var adminStatus = adminStatuses.Any(s => s == "Unavailable") ? "Unavailable"
            : adminStatuses.Any(s => s == "Progressing") ? "Progressing"
            : adminStatuses.All(s => s == "Scaled to zero") ? "Scaled to zero"
            : "Healthy";

        var displayName = GetAnnotation(allAnnotations, "control-panel.kubernetes.io/display-name")
            ?? HumanizeName(groupKey);
        var description = GetAnnotation(allAnnotations, "control-panel.kubernetes.io/description") ?? "";
        var owner = GetAnnotation(allAnnotations, "control-panel.kubernetes.io/owner") ?? "";
        var environment = GetAnnotation(allAnnotations, "control-panel.kubernetes.io/environment")
            ?? InferEnvironment(ns);
        var icon = GetAnnotation(allAnnotations, "control-panel.kubernetes.io/icon");
        var accentColor = GetAnnotation(allAnnotations, "control-panel.kubernetes.io/accent-color")
            ?? PickAccentColor(groupKey);
        var tags = ParseTags(GetAnnotation(allAnnotations, "control-panel.kubernetes.io/tags"));

        var lastChange = appPods
            .Select(p => p.Status?.StartTime ?? p.Metadata?.CreationTimestamp)
            .Where(t => t.HasValue)
            .Select(t => t!.Value)
            .DefaultIfEmpty(deployments.Max(d => d.Metadata?.CreationTimestamp ?? DateTime.UtcNow))
            .Max();

        var availability = userStatus == "Healthy"
            ? "Healthy and available"
            : userStatus == "Offline"
                ? "Currently unavailable"
                : null;

        return new DiscoveredApp
        {
            AppKey = SanitizeAppKey(groupKey),
            DisplayName = displayName,
            Description = description,
            Namespace = ns,
            Environment = environment,
            Owner = owner,
            UserStatus = userStatus,
            AdminStatus = adminStatus,
            StatusReason = AppStatusMapper.BuildStatusReason(appPods, components.FirstOrDefault(c => c.UserStatus != "Healthy")?.Name),
            ReadyComponents = components.Count(c => c.UserStatus == "Healthy"),
            TotalComponents = components.Count,
            ReadyPods = readyPods,
            TotalPods = appPods.Count,
            PrimaryUrl = allUrls.FirstOrDefault()?.Url,
            Urls = allUrls,
            Components = components,
            IsSystem = _config.SystemNamespaces.Contains(ns, StringComparer.OrdinalIgnoreCase),
            LastChange = lastChange,
            Icon = icon,
            AccentColor = accentColor,
            Tags = tags,
            Labels = allLabels,
            AvailabilitySummary = availability
        };
    }

    private static string GetGroupKey(V1Deployment deployment)
    {
        var labels = deployment.Metadata?.Labels ?? new Dictionary<string, string>();
        if (labels.TryGetValue("app.kubernetes.io/part-of", out var partOf) && !string.IsNullOrWhiteSpace(partOf))
            return partOf;
        if (labels.TryGetValue("app.kubernetes.io/instance", out var instance) && !string.IsNullOrWhiteSpace(instance))
            return instance;
        return deployment.Metadata?.Name ?? "unknown";
    }

    private static bool PodMatchesLabels(V1Pod pod, IDictionary<string, string> templateLabels)
    {
        var podLabels = pod.Metadata?.Labels ?? new Dictionary<string, string>();
        return templateLabels.All(kv =>
            podLabels.TryGetValue(kv.Key, out var v) && string.Equals(v, kv.Value, StringComparison.Ordinal));
    }

    private static AppSummaryStats BuildSummary(List<DiscoveredApp> apps)
    {
        var stats = new AppSummaryStats { Total = apps.Count };
        foreach (var app in apps)
        {
            switch (app.UserStatus)
            {
                case "Healthy": stats.Healthy++; break;
                case "Degraded": stats.Degraded++; break;
                case "Offline": stats.Offline++; break;
                case "Starting": stats.Starting++; break;
                default: stats.Unknown++; break;
            }
        }
        return stats;
    }

    private static string SanitizeAppKey(string key) =>
        key.ToLowerInvariant().Replace(' ', '-');

    private static string HumanizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return name;
        var spaced = name.Replace('-', ' ').Replace('_', ' ');
        return string.Join(' ', spaced.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpperInvariant(w[0]) + (w.Length > 1 ? w[1..].ToLowerInvariant() : "")));
    }

    private static string? GetAnnotation(IEnumerable<KeyValuePair<string, string>> annotations, string key) =>
        annotations.FirstOrDefault(a => a.Key == key).Value is { Length: > 0 } v ? v : null;

    private static string InferEnvironment(string ns) =>
        ns.Contains("prod", StringComparison.OrdinalIgnoreCase) ? "Production"
        : ns.Contains("staging", StringComparison.OrdinalIgnoreCase) ? "Staging"
        : ns.Contains("dev", StringComparison.OrdinalIgnoreCase) ? "Development"
        : "Other";

    private static string PickAccentColor(string appKey)
    {
        var hash = Math.Abs(appKey.GetHashCode(StringComparison.Ordinal));
        return AccentPalette[hash % AccentPalette.Length];
    }

    private static List<string> ParseTags(string? raw) =>
        string.IsNullOrWhiteSpace(raw)
            ? new List<string>()
            : raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    private static List<string> BuildSuggestedSteps(DiscoveredApp app, string? affectedComponent)
    {
        var steps = new List<string>();
        if (app.UserStatus is "Degraded" or "Offline")
        {
            if (affectedComponent != null)
                steps.Add($"View logs for {affectedComponent}");
            steps.Add("Check environment variables and configuration");
            steps.Add("Consider restarting the affected deployment");
        }
        return steps;
    }

    private static AppWorkloadInfo MapWorkload(V1Deployment d) => new()
    {
        Name = d.Metadata?.Name ?? "",
        Namespace = d.Metadata?.NamespaceProperty ?? "",
        Type = "Deployment",
        Status = AppStatusMapper.MapDeploymentAdminStatus(d.Spec?.Replicas ?? 0, d.Status?.ReadyReplicas ?? 0),
        Replicas = d.Spec?.Replicas ?? 0,
        ReadyReplicas = d.Status?.ReadyReplicas ?? 0,
        Image = d.Spec?.Template?.Spec?.Containers?.FirstOrDefault()?.Image ?? "",
        CreationTimestamp = d.Metadata?.CreationTimestamp ?? DateTime.UtcNow
    };

    private static AppServiceInfo MapService(V1Service s, List<V1Pod> appPods)
    {
        var selector = s.Spec?.Selector ?? new Dictionary<string, string>();
        var matched = appPods.Count(p => PodMatchesLabels(p, selector));
        var ports = string.Join(", ", (s.Spec?.Ports ?? new List<V1ServicePort>())
            .Select(p => $"{p.Port}->{p.TargetPort}"));
        return new AppServiceInfo
        {
            Name = s.Metadata?.Name ?? "",
            Namespace = s.Metadata?.NamespaceProperty ?? "",
            Type = s.Spec?.Type ?? "",
            ClusterIP = s.Spec?.ClusterIP,
            Ports = ports,
            Selector = string.Join(", ", selector.Select(kv => $"{kv.Key}={kv.Value}")),
            MatchedPods = matched
        };
    }

    private static List<AppIngressInfo> MapIngresses(List<V1Ingress> ingresses, List<V1Service> services)
    {
        var result = new List<AppIngressInfo>();
        foreach (var ingress in ingresses)
        {
            var tlsHosts = ingress.Spec?.Tls?
                .SelectMany(t => t.Hosts ?? new List<string>())
                .ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>();

            foreach (var rule in ingress.Spec?.Rules ?? new List<V1IngressRule>())
            {
                foreach (var path in rule.Http?.Paths ?? new List<V1HTTPIngressPath>())
                {
                    result.Add(new AppIngressInfo
                    {
                        Name = ingress.Metadata?.Name ?? "",
                        Namespace = ingress.Metadata?.NamespaceProperty ?? "",
                        Host = rule.Host ?? "",
                        Path = path.Path ?? "/",
                        Service = path.Backend?.Service?.Name ?? "",
                        Port = path.Backend?.Service?.Port?.Number,
                        TlsEnabled = tlsHosts.Contains(rule.Host ?? ""),
                        IngressClass = ingress.Spec?.IngressClassName,
                        ExternalIP = ingress.Status?.LoadBalancer?.Ingress?.FirstOrDefault()?.Ip
                    });
                }
            }
        }
        return result;
    }

    private static PodInfo MapPodInfo(V1Pod pod)
    {
        var containers = pod.Spec?.Containers?.Select(c => new ContainerInfo
        {
            Name = c.Name,
            Image = c.Image,
            Status = "Unknown",
            Ready = false,
            RestartCount = 0,
            State = pod.Status?.Phase ?? "Unknown"
        }).ToList() ?? new List<ContainerInfo>();

        if (pod.Status?.ContainerStatuses != null)
        {
            foreach (var cs in pod.Status.ContainerStatuses)
            {
                var ci = containers.FirstOrDefault(c => c.Name == cs.Name);
                if (ci == null) continue;
                ci.Ready = cs.Ready;
                ci.RestartCount = cs.RestartCount;
                ci.State = cs.State?.Waiting?.Reason ?? cs.State?.Terminated?.Reason ?? "Running";
                ci.Status = ci.State;
            }
        }

        return new PodInfo
        {
            Name = pod.Metadata?.Name ?? "",
            Namespace = pod.Metadata?.NamespaceProperty ?? "",
            Status = pod.Status?.Phase ?? "",
            Phase = pod.Status?.Phase ?? "",
            PodIP = pod.Status?.PodIP,
            NodeName = pod.Spec?.NodeName,
            CreationTimestamp = pod.Metadata?.CreationTimestamp ?? DateTime.UtcNow,
            Containers = containers,
            Labels = pod.Metadata?.Labels?.ToDictionary(k => k.Key, v => v.Value) ?? new Dictionary<string, string>(),
            Annotations = pod.Metadata?.Annotations?.ToDictionary(k => k.Key, v => v.Value) ?? new Dictionary<string, string>(),
            RestartCount = pod.Status?.ContainerStatuses?.Sum(c => c.RestartCount) ?? 0,
            IsReady = pod.Status?.ContainerStatuses?.All(c => c.Ready) == true
        };
    }

    private static ClusterEvent MapEvent(Corev1Event e) => new()
    {
        Type = e.Type ?? "",
        Reason = e.Reason ?? "",
        Message = e.Message ?? "",
        Timestamp = e.LastTimestamp ?? e.EventTime ?? DateTime.UtcNow,
        InvolvedObjectKind = e.InvolvedObject?.Kind ?? "",
        InvolvedObjectName = e.InvolvedObject?.Name ?? "",
        Namespace = e.Metadata?.NamespaceProperty ?? e.InvolvedObject?.NamespaceProperty ?? ""
    };
}
