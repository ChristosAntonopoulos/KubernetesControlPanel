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
    /// Gets pod events
    /// </summary>
    Task<List<ClusterEvent>> GetPodEventsAsync(string namespaceName, string podName);

    /// <summary>
    /// Restarts a pod
    /// </summary>
    Task<bool> RestartPodAsync(string namespaceName, string podName);

    /// <summary>
    /// Deletes a pod
    /// </summary>
    Task<bool> DeletePodAsync(string namespaceName, string podName);
} 