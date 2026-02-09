using System.Text.Json;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using k8s;
using Microsoft.Extensions.Logging;

namespace KubernetesControlPanel.Services.Services;

/// <summary>
/// Fetches metrics from the Kubernetes Metrics API (metrics-server) via CustomObjects API.
/// </summary>
public class MetricsProvider : IMetricsProvider
{
    private const string MetricsGroup = "metrics.k8s.io";
    private const string MetricsVersion = "v1beta1";

    private readonly IKubernetes _kubernetesClient;
    private readonly ILogger<MetricsProvider> _logger;

    public MetricsProvider(IKubernetes kubernetesClient, ILogger<MetricsProvider> logger)
    {
        _kubernetesClient = kubernetesClient;
        _logger = logger;
    }

    public async Task<IReadOnlyList<NodeMetricsEntry>?> GetNodeMetricsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _kubernetesClient.CustomObjects.ListClusterCustomObjectAsync(
                MetricsGroup, MetricsVersion, "nodes", cancellationToken: cancellationToken);
            return ParseNodeMetricsList(response);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Metrics API (node metrics) unavailable. Ensure metrics-server is installed.");
            return null;
        }
    }

    public async Task<IReadOnlyList<PodMetrics>> GetPodMetricsListAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _kubernetesClient.CustomObjects.ListClusterCustomObjectAsync(
                MetricsGroup, MetricsVersion, "pods", cancellationToken: cancellationToken);
            return ParsePodMetricsList(response);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Metrics API (pod metrics) unavailable. Ensure metrics-server is installed.");
            return new List<PodMetrics>();
        }
    }

    public async Task<PodMetrics?> GetPodMetricsAsync(string namespaceName, string podName, CancellationToken cancellationToken = default)
    {
        try
        {
            var list = await GetPodMetricsListAsync(cancellationToken);
            return list.FirstOrDefault(p =>
                string.Equals(p.Namespace, namespaceName, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(p.Name, podName, StringComparison.OrdinalIgnoreCase));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not get metrics for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return null;
        }
    }

    private static IReadOnlyList<NodeMetricsEntry>? ParseNodeMetricsList(object? response)
    {
        if (response == null) return null;
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(response));
        if (!doc.RootElement.TryGetProperty("items", out var items))
            return Array.Empty<NodeMetricsEntry>();
        var list = new List<NodeMetricsEntry>();
        foreach (var item in items.EnumerateArray())
        {
            var name = item.TryGetProperty("metadata", out var meta) && meta.TryGetProperty("name", out var n)
                ? n.GetString() ?? ""
                : "";
            if (string.IsNullOrEmpty(name)) continue;
            long cpu = 0, mem = 0;
            if (item.TryGetProperty("usage", out var usage))
            {
                if (usage.TryGetProperty("cpu", out var cpuEl))
                    cpu = ParseCpuToMillicores(cpuEl);
                if (usage.TryGetProperty("memory", out var memEl))
                    mem = ParseMemoryToBytes(memEl);
            }
            list.Add(new NodeMetricsEntry { Name = name, CpuMillicores = cpu, MemoryBytes = mem });
        }
        return list;
    }

    private static List<PodMetrics> ParsePodMetricsList(object? response)
    {
        var result = new List<PodMetrics>();
        if (response == null) return result;
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(response));
        if (!doc.RootElement.TryGetProperty("items", out var items))
            return result;
        foreach (var item in items.EnumerateArray())
        {
            var pm = ParseSinglePodMetrics(item);
            if (pm != null)
                result.Add(pm);
        }
        return result;
    }

    private static PodMetrics? ParseSinglePodMetrics(JsonElement item)
    {
        string name = "", ns = "";
        if (item.TryGetProperty("metadata", out var meta))
        {
            if (meta.TryGetProperty("name", out var n)) name = n.GetString() ?? "";
            if (meta.TryGetProperty("namespace", out var nsEl)) ns = nsEl.GetString() ?? "";
        }
        if (string.IsNullOrEmpty(name)) return null;

        var containers = new List<ContainerMetrics>();
        long totalCpu = 0, totalMem = 0;
        if (item.TryGetProperty("containers", out var containersEl))
        {
            foreach (var c in containersEl.EnumerateArray())
            {
                var cName = c.TryGetProperty("name", out var cn) ? cn.GetString() ?? "" : "";
                long cpu = 0, mem = 0;
                if (c.TryGetProperty("usage", out var usage))
                {
                    if (usage.TryGetProperty("cpu", out var cpuEl)) cpu = ParseCpuToMillicores(cpuEl);
                    if (usage.TryGetProperty("memory", out var memEl)) mem = ParseMemoryToBytes(memEl);
                }
                totalCpu += cpu;
                totalMem += mem;
                containers.Add(new ContainerMetrics { Name = cName, CpuUsage = cpu, MemoryUsage = mem });
            }
        }

        DateTime timestamp = DateTime.UtcNow;
        if (item.TryGetProperty("timestamp", out var tsEl))
        {
            var tsStr = tsEl.GetString();
            if (!string.IsNullOrEmpty(tsStr) && DateTime.TryParse(tsStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out var ts))
                timestamp = ts;
        }

        return new PodMetrics
        {
            Name = name,
            Namespace = ns,
            Containers = containers,
            Timestamp = timestamp,
            TotalCpuUsage = totalCpu,
            TotalMemoryUsage = totalMem
        };
    }

    private static long ParseCpuToMillicores(JsonElement el)
    {
        if (el.ValueKind == JsonValueKind.Number)
            return el.TryGetInt64(out var n) ? n : 0;
        var s = el.GetString();
        if (string.IsNullOrEmpty(s)) return 0;
        if (s.EndsWith("n", StringComparison.OrdinalIgnoreCase))
            return (long)(double.TryParse(s.TrimEnd('n', 'N'), out var v) ? v / 1_000_000 : 0);
        if (s.EndsWith("u", StringComparison.OrdinalIgnoreCase))
            return (long)(double.TryParse(s.TrimEnd('u', 'U'), out var v) ? v : 0);
        if (s.EndsWith("m"))
            return (long)(double.TryParse(s.TrimEnd('m'), out var v) ? v : 0);
        return (long)(double.TryParse(s, out var cores) ? cores * 1000 : 0);
    }

    private static long ParseMemoryToBytes(JsonElement el)
    {
        if (el.ValueKind == JsonValueKind.Number)
            return el.TryGetInt64(out var n) ? n : 0;
        var s = el.GetString();
        if (string.IsNullOrEmpty(s)) return 0;
        s = s.Trim();
        double mult = 1;
        if (s.EndsWith("Ki", StringComparison.OrdinalIgnoreCase)) { s = s[..^2]; mult = 1024; }
        else if (s.EndsWith("Mi", StringComparison.OrdinalIgnoreCase)) { s = s[..^2]; mult = 1024 * 1024; }
        else if (s.EndsWith("Gi", StringComparison.OrdinalIgnoreCase)) { s = s[..^2]; mult = 1024 * 1024 * 1024; }
        else if (s.EndsWith("Ti", StringComparison.OrdinalIgnoreCase)) { s = s[..^2]; mult = 1024.0 * 1024 * 1024 * 1024; }
        else if (s.EndsWith("K", StringComparison.OrdinalIgnoreCase)) { s = s.TrimEnd('K', 'k'); mult = 1000; }
        else if (s.EndsWith("M", StringComparison.OrdinalIgnoreCase)) { s = s.TrimEnd('M', 'm'); mult = 1000 * 1000; }
        else if (s.EndsWith("G", StringComparison.OrdinalIgnoreCase)) { s = s.TrimEnd('G', 'g'); mult = 1000 * 1000 * 1000; }
        return (long)(double.TryParse(s, out var v) ? v * mult : 0);
    }
}
