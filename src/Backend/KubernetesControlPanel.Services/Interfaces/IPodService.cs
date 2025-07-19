using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

/// <summary>
/// Interface for pod operations
/// </summary>
public interface IPodService
{
    /// <summary>
    /// Gets all pods
    /// </summary>
    Task<List<PodInfo>> GetAllPodsAsync();

    /// <summary>
    /// Gets pods by namespace
    /// </summary>
    Task<List<PodInfo>> GetPodsByNamespaceAsync(string namespaceName);

    /// <summary>
    /// Gets pod details
    /// </summary>
    Task<PodInfo?> GetPodDetailsAsync(string namespaceName, string podName);

    /// <summary>
    /// Gets pod logs
    /// </summary>
    Task<string> GetPodLogsAsync(string namespaceName, string podName, string? containerName = null, int? tailLines = null);

    /// <summary>
    /// Gets pod logs from previous container instance
    /// </summary>
    Task<string> GetPodPreviousLogsAsync(string namespaceName, string podName, string? containerName = null, int? tailLines = null);

    /// <summary>
    /// Gets pod events
    /// </summary>
    Task<List<ClusterEvent>> GetPodEventsAsync(string namespaceName, string podName);

    /// <summary>
    /// Gets pod metrics (CPU and memory usage)
    /// </summary>
    Task<PodMetrics?> GetPodMetricsAsync(string namespaceName, string podName);

    /// <summary>
    /// Restarts a pod
    /// </summary>
    Task<bool> RestartPodAsync(string namespaceName, string podName);

    /// <summary>
    /// Restarts a pod and preserves logs from before restart
    /// </summary>
    Task<PodRestartResult> RestartPodWithLogsAsync(string namespaceName, string podName);

    /// <summary>
    /// Deletes a pod
    /// </summary>
    Task<bool> DeletePodAsync(string namespaceName, string podName);

    /// <summary>
    /// Gets pod resource usage history
    /// </summary>
    Task<List<PodResourceUsage>> GetPodResourceHistoryAsync(string namespaceName, string podName, int hours = 24);
} 