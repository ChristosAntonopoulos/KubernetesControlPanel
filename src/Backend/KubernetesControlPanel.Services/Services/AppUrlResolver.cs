using System.Net;
using System.Net.Sockets;
using k8s.Models;
using KubernetesControlPanel.Core.Configuration;
using KubernetesControlPanel.Core.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KubernetesControlPanel.Services.Services;

public class AppUrlResolver
{
    private readonly KubernetesConfig _config;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AppUrlResolver> _logger;

    public AppUrlResolver(
        IOptions<KubernetesConfig> config,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AppUrlResolver> logger)
    {
        _config = config.Value;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<string?> ResolveNodePortPublicHostAsync(
        IList<V1Service> services,
        IList<V1Ingress> ingresses,
        Func<Task<IList<V1Node>>> listNodes)
    {
        var configured = GetConfiguredNodePortHost();
        if (configured != null) return configured;

        try
        {
            var nodes = await listNodes();
            var fromNodes = PickHostFromNodes(nodes);
            if (fromNodes != null) return fromNodes;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Could not list nodes for NodePort host detection");
        }

        return PickHostFromLoadBalancers(services)
            ?? PickHostFromIngresses(ingresses)
            ?? TryGetRequestPublicHost();
    }

    public List<AppUrl> BuildUrlsForService(
        V1Service service,
        IList<V1Ingress> ingresses,
        string? nodePortPublicHost)
    {
        var urls = new List<AppUrl>();
        var serviceName = service.Metadata?.Name ?? string.Empty;
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

                    urls.Add(new AppUrl
                    {
                        Url = url,
                        Label = pathPrefix == "/" ? "Web App" : $"Web ({pathPrefix})",
                        Source = "Ingress"
                    });
                }
            }
        }

        if (string.Equals(service.Spec?.Type, "LoadBalancer", StringComparison.OrdinalIgnoreCase))
        {
            foreach (var lb in service.Status?.LoadBalancer?.Ingress ?? new List<V1LoadBalancerIngress>())
            {
                var host = lb.Hostname ?? lb.Ip;
                if (string.IsNullOrWhiteSpace(host)) continue;

                foreach (var port in ports)
                {
                    var portNum = port.Port;
                    var url = portNum is 80 or 443 ? $"http://{host}" : $"http://{host}:{portNum}";
                    urls.Add(new AppUrl { Url = url, Label = "Web App", Source = "LoadBalancer" });
                }
            }
        }

        if (string.Equals(service.Spec?.Type, "NodePort", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(nodePortPublicHost))
        {
            foreach (var port in ports.Where(p => p.NodePort.HasValue))
            {
                urls.Add(new AppUrl
                {
                    Url = $"http://{nodePortPublicHost}:{port.NodePort}",
                    Label = $"Web App (port {port.NodePort})",
                    Source = "NodePort"
                });
            }
        }

        var annotationUrl = TryGetAnnotationUrl(service.Metadata?.Annotations);
        if (annotationUrl != null)
        {
            urls.Add(new AppUrl { Url = annotationUrl, Label = "Web App", Source = "Annotation" });
        }

        return urls;
    }

    public static bool ServiceMatchesSelector(V1Service service, IDictionary<string, string> podLabels)
    {
        var selector = service.Spec?.Selector;
        if (selector == null || selector.Count == 0 || podLabels.Count == 0)
            return false;

        return selector.All(kv =>
            podLabels.TryGetValue(kv.Key, out var value) &&
            string.Equals(value, kv.Value, StringComparison.Ordinal));
    }

    private string? GetConfiguredNodePortHost()
    {
        if (!string.IsNullOrWhiteSpace(_config.NodePortPublicHost))
            return _config.NodePortPublicHost.Trim();

        var envHost = Environment.GetEnvironmentVariable("NODE_PORT_PUBLIC_HOST");
        return !string.IsNullOrWhiteSpace(envHost) ? envHost.Trim() : null;
    }

    private static string? PickHostFromNodes(IList<V1Node> nodes)
    {
        foreach (var node in nodes)
        {
            var external = node.Status?.Addresses?.FirstOrDefault(a => a.Type == "ExternalIP")?.Address;
            if (IsUsableHost(external)) return external!.Trim();
        }

        foreach (var node in nodes)
        {
            var internalIp = node.Status?.Addresses?.FirstOrDefault(a => a.Type == "InternalIP")?.Address;
            if (IsUsableHost(internalIp) && !IsLoopbackOrLinkLocal(internalIp))
                return internalIp!.Trim();
        }

        return null;
    }

    private static string? PickHostFromLoadBalancers(IEnumerable<V1Service> services)
    {
        foreach (var service in services.Where(s =>
            string.Equals(s.Spec?.Type, "LoadBalancer", StringComparison.OrdinalIgnoreCase)))
        {
            foreach (var lb in service.Status?.LoadBalancer?.Ingress ?? new List<V1LoadBalancerIngress>())
            {
                var host = lb.Hostname ?? lb.Ip;
                if (IsUsableHost(host)) return host!.Trim();
            }
        }
        return null;
    }

    private static string? PickHostFromIngresses(IEnumerable<V1Ingress> ingresses)
    {
        foreach (var ingress in ingresses)
        {
            foreach (var rule in ingress.Spec?.Rules ?? new List<V1IngressRule>())
            {
                if (IsUsableHost(rule.Host)) return rule.Host!.Trim();
            }

            var annotated = GetAnnotation(ingress.Metadata?.Annotations, "external-dns.alpha.kubernetes.io/hostname");
            if (IsUsableHost(annotated)) return annotated!.Trim();
        }
        return null;
    }

    private string? TryGetRequestPublicHost()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context == null) return null;

        foreach (var raw in new[] {
            context.Request.Headers["X-Forwarded-Host"].FirstOrDefault(),
            context.Request.Host.Host })
        {
            var host = NormalizeHost(raw);
            if (IsUsableRequestHost(host)) return host;
        }
        return null;
    }

    private static string? NormalizeHost(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var host = raw.Split(',')[0].Trim();
        if (host.StartsWith('['))
        {
            var end = host.IndexOf(']');
            if (end > 0) return host[1..end];
        }
        var colon = host.LastIndexOf(':');
        if (colon > 0 && host.Count(c => c == ':') == 1 && IPAddress.TryParse(host[..colon], out _))
            return host[..colon];
        if (colon > 0 && host.Contains(':') && !IPAddress.TryParse(host, out _))
            return host[..colon];
        return host;
    }

    private static bool IsUsableRequestHost(string? host)
    {
        if (!IsUsableHost(host)) return false;
        if (host!.Equals("localhost", StringComparison.OrdinalIgnoreCase)) return false;
        if (host.StartsWith("127.", StringComparison.Ordinal)) return false;
        if (host.Contains(".svc.", StringComparison.OrdinalIgnoreCase) ||
            host.Contains(".cluster.local", StringComparison.OrdinalIgnoreCase))
            return false;
        return true;
    }

    private static bool IsUsableHost(string? host) =>
        !string.IsNullOrWhiteSpace(host) &&
        !host.Trim().Equals("localhost", StringComparison.OrdinalIgnoreCase);

    private static bool IsLoopbackOrLinkLocal(string? host)
    {
        if (!IPAddress.TryParse(host, out var ip)) return false;
        if (IPAddress.IsLoopback(ip)) return true;
        if (ip.AddressFamily == AddressFamily.InterNetwork)
        {
            var bytes = ip.GetAddressBytes();
            if (bytes[0] == 169 && bytes[1] == 254) return true;
        }
        return false;
    }

    private static string? GetAnnotation(IDictionary<string, string>? annotations, string key) =>
        annotations != null && annotations.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value : null;

    private static string? TryGetAnnotationUrl(IDictionary<string, string>? annotations)
    {
        if (annotations == null) return null;
        foreach (var key in new[] { "external-dns.alpha.kubernetes.io/hostname", "linkerd.io/external-hostname" })
        {
            if (annotations.TryGetValue(key, out var host) && !string.IsNullOrWhiteSpace(host))
                return host.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? host : $"https://{host}";
        }
        return null;
    }
}
