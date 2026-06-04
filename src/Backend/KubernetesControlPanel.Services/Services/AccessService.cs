using k8s;
using k8s.Models;
using KubernetesControlPanel.Core.Configuration;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KubernetesControlPanel.Services.Services;

public class AccessService : IAccessService
{
    private readonly IKubernetes _kubernetesClient;
    private readonly KubernetesConfig _config;
    private readonly ILogger<AccessService> _logger;

    public AccessService(
        IKubernetes kubernetesClient,
        IOptions<KubernetesConfig> config,
        ILogger<AccessService> logger)
    {
        _kubernetesClient = kubernetesClient;
        _config = config.Value;
        _logger = logger;
    }

    public async Task<ClusterAccessOverview> GetClusterAccessAsync()
    {
        var overview = new ClusterAccessOverview { LastUpdated = DateTime.UtcNow };

        try
        {
            var deploymentsTask = _kubernetesClient.AppsV1.ListDeploymentForAllNamespacesAsync();
            var servicesTask = _kubernetesClient.CoreV1.ListServiceForAllNamespacesAsync();
            var ingressesTask = _kubernetesClient.NetworkingV1.ListIngressForAllNamespacesAsync();

            await Task.WhenAll(deploymentsTask, servicesTask, ingressesTask);

            var deployments = deploymentsTask.Result.Items;
            var services = servicesTask.Result.Items;
            var ingresses = ingressesTask.Result.Items;

            var servicesByNs = services
                .GroupBy(s => s.Namespace())
                .ToDictionary(g => g.Key, g => g.ToList());

            var ingressesByNs = ingresses
                .GroupBy(i => i.Namespace())
                .ToDictionary(g => g.Key, g => g.ToList());

            var groups = new Dictionary<string, AccessNamespaceGroup>();

            foreach (var deployment in deployments.OrderBy(d => d.Namespace()).ThenBy(d => d.Name()))
            {
                var ns = deployment.Namespace();
                if (!groups.TryGetValue(ns, out var group))
                {
                    group = new AccessNamespaceGroup
                    {
                        Namespace = ns,
                        IsSystemNamespace = _config.SystemNamespaces.Contains(ns, StringComparer.OrdinalIgnoreCase)
                    };
                    groups[ns] = group;
                }

                var templateLabels = deployment.Spec?.Template?.Metadata?.Labels
                    ?? new Dictionary<string, string>();

                servicesByNs.TryGetValue(ns, out var nsServices);
                nsServices ??= new List<V1Service>();

                var matchedServices = nsServices
                    .Where(s => ServiceMatchesSelector(s, templateLabels))
                    .ToList();

                ingressesByNs.TryGetValue(ns, out var nsIngresses);
                nsIngresses ??= new List<V1Ingress>();

                var urls = new List<AccessUrl>();
                foreach (var svc in matchedServices)
                {
                    urls.AddRange(BuildUrlsForService(svc, nsIngresses, _config.NodePortPublicHost));
                }

                urls = urls
                    .GroupBy(u => u.Url)
                    .Select(g => g.First())
                    .OrderBy(u => u.Label)
                    .ToList();

                var status = MapDeploymentStatus(deployment);
                var app = new AccessAppEntry
                {
                    Name = deployment.Name(),
                    DisplayName = HumanizeName(deployment.Name()),
                    Kind = "Application",
                    Status = status.Label,
                    StatusDetail = status.Detail,
                    Urls = urls,
                    NoUrlReason = urls.Count == 0 ? DescribeNoUrl(matchedServices) : null,
                    Labels = deployment.Metadata?.Labels?.ToDictionary(k => k.Key, v => v.Value)
                        ?? new Dictionary<string, string>()
                };

                group.Apps.Add(app);
            }

            overview.Namespaces = groups.Values
                .OrderBy(g => g.IsSystemNamespace)
                .ThenBy(g => g.Namespace)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building cluster access overview");
            throw;
        }

        return overview;
    }

    private static bool ServiceMatchesSelector(V1Service service, IDictionary<string, string> podLabels)
    {
        var selector = service.Spec?.Selector;
        if (selector == null || selector.Count == 0 || podLabels.Count == 0)
            return false;

        return selector.All(kv =>
            podLabels.TryGetValue(kv.Key, out var value) &&
            string.Equals(value, kv.Value, StringComparison.Ordinal));
    }

    private static List<AccessUrl> BuildUrlsForService(
        V1Service service,
        IList<V1Ingress> ingresses,
        string? nodePortPublicHost)
    {
        var urls = new List<AccessUrl>();
        var serviceName = service.Name();
        var ports = service.Spec?.Ports ?? new List<V1ServicePort>();

        foreach (var ingress in ingresses)
        {
            var tlsHosts = ingress.Spec?.Tls?
                .SelectMany(t => t.Hosts ?? new List<string>())
                .ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var rule in ingress.Spec?.Rules ?? new List<V1IngressRule>())
            {
                if (rule.Http?.Paths == null) continue;

                foreach (var path in rule.Http.Paths)
                {
                    var backendName = path.Backend?.Service?.Name;
                    if (!string.Equals(backendName, serviceName, StringComparison.OrdinalIgnoreCase))
                        continue;

                    var host = rule.Host ?? GetAnnotation(ingress.Metadata?.Annotations, "external-dns.alpha.kubernetes.io/hostname");
                    if (string.IsNullOrWhiteSpace(host)) continue;

                    var pathPrefix = string.IsNullOrEmpty(path.Path) ? "/" : path.Path;
                    var scheme = tlsHosts.Contains(host) ? "https" : "http";
                    var port = path.Backend?.Service?.Port?.Number;
                    var portSuffix = port is > 0 and not 80 and not 443 ? $":{port}" : "";
                    var url = $"{scheme}://{host}{portSuffix}{pathPrefix}";

                    urls.Add(new AccessUrl
                    {
                        Url = url,
                        Label = $"Web address ({host})",
                        Source = "Ingress"
                    });
                }
            }
        }

        if (string.Equals(service.Spec?.Type, "LoadBalancer", StringComparison.OrdinalIgnoreCase))
        {
            var lbHosts = service.Status?.LoadBalancer?.Ingress ?? new List<V1LoadBalancerIngress>();
            foreach (var lb in lbHosts)
            {
                var host = lb.Hostname ?? lb.Ip;
                if (string.IsNullOrWhiteSpace(host)) continue;

                foreach (var port in ports)
                {
                    var portNum = port.Port;
                    var url = portNum is 80 or 443
                        ? $"http://{host}"
                        : $"http://{host}:{portNum}";

                    urls.Add(new AccessUrl
                    {
                        Url = url,
                        Label = $"Load balancer ({port.Name ?? port.Port.ToString()})",
                        Source = "LoadBalancer"
                    });
                }
            }
        }

        if (string.Equals(service.Spec?.Type, "NodePort", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(nodePortPublicHost))
        {
            foreach (var port in ports.Where(p => p.NodePort.HasValue))
            {
                urls.Add(new AccessUrl
                {
                    Url = $"http://{nodePortPublicHost}:{port.NodePort}",
                    Label = $"Node port {port.NodePort}",
                    Source = "NodePort"
                });
            }
        }

        var annotationUrl = TryGetAnnotationUrl(service.Metadata?.Annotations);
        if (annotationUrl != null)
        {
            urls.Add(new AccessUrl
            {
                Url = annotationUrl,
                Label = "Configured link",
                Source = "Annotation"
            });
        }

        return urls;
    }

    private static string? GetAnnotation(IDictionary<string, string>? annotations, string key)
    {
        if (annotations != null && annotations.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
            return value;
        return null;
    }

    private static string? TryGetAnnotationUrl(IDictionary<string, string>? annotations)
    {
        if (annotations == null) return null;

        var keys = new[]
        {
            "external-dns.alpha.kubernetes.io/hostname",
            "linkerd.io/external-hostname"
        };

        foreach (var key in keys)
        {
            if (annotations.TryGetValue(key, out var host) && !string.IsNullOrWhiteSpace(host))
            {
                return host.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                    ? host
                    : $"https://{host}";
            }
        }

        return null;
    }

    private static (string Label, string? Detail) MapDeploymentStatus(V1Deployment deployment)
    {
        var replicas = deployment.Spec?.Replicas ?? 0;
        var ready = deployment.Status?.ReadyReplicas ?? 0;

        if (replicas == 0)
            return ("Stopped", "This application is scaled to zero instances.");
        if (ready >= replicas)
            return ("Running", $"{ready} of {replicas} instances ready.");
        if (ready > 0)
            return ("Starting", $"{ready} of {replicas} instances ready so far.");
        return ("Unavailable", "No instances are ready yet.");
    }

    private static string HumanizeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return name;
        var spaced = name.Replace('-', ' ').Replace('_', ' ');
        return string.Join(' ', spaced.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpperInvariant(w[0]) + (w.Length > 1 ? w[1..].ToLowerInvariant() : "")));
    }

    private static string DescribeNoUrl(IReadOnlyList<V1Service> matchedServices)
    {
        if (matchedServices.Count == 0)
            return "No network service is linked to this application yet.";

        var types = matchedServices.Select(s => s.Spec?.Type ?? "Unknown").Distinct().ToList();
        if (types.All(t => t == "ClusterIP"))
            return "This application is only reachable inside the cluster (no public web address).";

        if (types.Any(t => t == "NodePort"))
            return "Set Kubernetes:NodePortPublicHost in appsettings to generate NodePort links.";

        if (types.Any(t => t == "LoadBalancer"))
            return "Waiting for a public load balancer address from the cluster.";

        return "No public web address was found for this application.";
    }
}

internal static class K8sMetadataExtensions
{
    public static string Namespace(this V1ObjectMeta? metadata) =>
        metadata?.NamespaceProperty ?? string.Empty;

    public static string Namespace(this IMetadata<V1ObjectMeta>? obj) =>
        obj?.Metadata.Namespace() ?? string.Empty;

    public static string Name(this IMetadata<V1ObjectMeta>? obj) =>
        obj?.Metadata?.Name ?? string.Empty;
}
