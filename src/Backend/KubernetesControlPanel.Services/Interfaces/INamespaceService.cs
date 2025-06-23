using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

/// <summary>
/// Interface for namespace operations
/// </summary>
public interface INamespaceService
{
    /// <summary>
    /// Gets all namespaces
    /// </summary>
    Task<List<string>> GetAllNamespacesAsync();

    /// <summary>
    /// Gets namespace details
    /// </summary>
    Task<NamespacePodCount?> GetNamespaceDetailsAsync(string namespaceName);

    /// <summary>
    /// Gets namespace events
    /// </summary>
    Task<List<ClusterEvent>> GetNamespaceEventsAsync(string namespaceName);

    /// <summary>
    /// Gets namespace resource quotas
    /// </summary>
    Task<object> GetNamespaceResourceQuotasAsync(string namespaceName);
} 