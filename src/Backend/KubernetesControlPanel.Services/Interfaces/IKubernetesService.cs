using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

/// <summary>
/// Interface for Kubernetes cluster operations
/// </summary>
public interface IKubernetesService
{
    /// <summary>
    /// Gets cluster information
    /// </summary>
    Task<DashboardInfo> GetClusterInfoAsync();

    /// <summary>
    /// Gets all pods across all namespaces
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
    /// Gets all nodes
    /// </summary>
    Task<List<NodeInfo>> GetAllNodesAsync();

    /// <summary>
    /// Gets node details
    /// </summary>
    Task<NodeInfo?> GetNodeDetailsAsync(string nodeName);

    /// <summary>
    /// Gets all namespaces
    /// </summary>
    Task<List<string>> GetAllNamespacesAsync();

    /// <summary>
    /// Gets namespace details
    /// </summary>
    Task<NamespacePodCount?> GetNamespaceDetailsAsync(string namespaceName);

    /// <summary>
    /// Gets recent events
    /// </summary>
    Task<List<ClusterEvent>> GetRecentEventsAsync(int count = 50);

    /// <summary>
    /// Checks if the service can connect to the cluster
    /// </summary>
    Task<bool> IsClusterAccessibleAsync();
} 