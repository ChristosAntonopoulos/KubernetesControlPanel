using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

/// <summary>
/// Interface for node operations
/// </summary>
public interface INodeService
{
    /// <summary>
    /// Gets all nodes
    /// </summary>
    Task<List<NodeInfo>> GetAllNodesAsync();

    /// <summary>
    /// Gets node details
    /// </summary>
    Task<NodeInfo?> GetNodeDetailsAsync(string nodeName);

    /// <summary>
    /// Gets node events
    /// </summary>
    Task<List<ClusterEvent>> GetNodeEventsAsync(string nodeName);

    /// <summary>
    /// Gets pods running on a node
    /// </summary>
    Task<List<PodInfo>> GetPodsOnNodeAsync(string nodeName);
} 