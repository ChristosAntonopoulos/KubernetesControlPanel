using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

/// <summary>
/// Provides metrics from the Kubernetes Metrics API (metrics-server).
/// </summary>
public interface IMetricsProvider
{
    /// <summary>
    /// Gets current CPU and memory usage per node. Returns null if metrics-server is unavailable.
    /// </summary>
    Task<IReadOnlyList<NodeMetricsEntry>?> GetNodeMetricsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets metrics for all pods (all namespaces). Returns empty list if metrics-server is unavailable.
    /// </summary>
    Task<IReadOnlyList<PodMetrics>> GetPodMetricsListAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets metrics for a single pod. Returns null if not found or metrics unavailable.
    /// </summary>
    Task<PodMetrics?> GetPodMetricsAsync(string namespaceName, string podName, CancellationToken cancellationToken = default);
}

/// <summary>
/// Node usage from Metrics API (name + usage).
/// </summary>
public class NodeMetricsEntry
{
    public string Name { get; set; } = string.Empty;
    public long CpuMillicores { get; set; }
    public long MemoryBytes { get; set; }
}
