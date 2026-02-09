using k8s;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace KubernetesControlPanel.Services.Services;

/// <summary>
/// Service for node operations
/// </summary>
public class NodeService : INodeService
{
    private readonly IKubernetesService _kubernetesService;
    private readonly IKubernetes _kubernetesClient;
    private readonly IMetricsProvider _metricsProvider;
    private readonly ILogger<NodeService> _logger;

    public NodeService(
        IKubernetesService kubernetesService,
        IKubernetes kubernetesClient,
        IMetricsProvider metricsProvider,
        ILogger<NodeService> logger)
    {
        _kubernetesService = kubernetesService;
        _kubernetesClient = kubernetesClient;
        _metricsProvider = metricsProvider;
        _logger = logger;
    }

    public async Task<List<NodeInfo>> GetAllNodesAsync()
    {
        try
        {
            var nodes = await _kubernetesService.GetAllNodesAsync();
            await AttachNodeMetricsAsync(nodes);
            return nodes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all nodes");
            throw;
        }
    }

    public async Task<NodeInfo?> GetNodeDetailsAsync(string nodeName)
    {
        try
        {
            var node = await _kubernetesService.GetNodeDetailsAsync(nodeName);
            if (node != null)
                await AttachNodeMetricsAsync(new List<NodeInfo> { node });
            return node;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting node details for {NodeName}", nodeName);
            return null;
        }
    }

    private async Task AttachNodeMetricsAsync(List<NodeInfo> nodes)
    {
        var nodeMetrics = await _metricsProvider.GetNodeMetricsAsync();
        if (nodeMetrics == null) return;
        var byName = nodeMetrics.ToDictionary(m => m.Name, StringComparer.OrdinalIgnoreCase);
        foreach (var node in nodes)
        {
            if (byName.TryGetValue(node.Name, out var entry))
            {
                node.CpuUsageMillicores = entry.CpuMillicores;
                node.MemoryUsageBytes = entry.MemoryBytes;
            }
        }
    }

    public async Task<List<ClusterEvent>> GetNodeEventsAsync(string nodeName)
    {
        try
        {
            var events = await _kubernetesClient.CoreV1.ListEventForAllNamespacesAsync(
                fieldSelector: $"involvedObject.name={nodeName},involvedObject.kind=Node");

            return events.Items
                .OrderByDescending(e => e.LastTimestamp)
                .Take(50)
                .Select(e => new ClusterEvent
                {
                    Type = e.Type,
                    Reason = e.Reason,
                    Message = e.Message,
                    Timestamp = e.LastTimestamp ?? DateTime.UtcNow,
                    InvolvedObjectKind = e.InvolvedObject?.Kind ?? string.Empty,
                    InvolvedObjectName = e.InvolvedObject?.Name ?? string.Empty,
                    Namespace = e.InvolvedObject?.NamespaceProperty ?? string.Empty
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events for node {NodeName}", nodeName);
            return new List<ClusterEvent>();
        }
    }

    public async Task<List<PodInfo>> GetPodsOnNodeAsync(string nodeName)
    {
        try
        {
            var allPods = await _kubernetesService.GetAllPodsAsync();
            return allPods.Where(p => p.NodeName == nodeName).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pods on node {NodeName}", nodeName);
            return new List<PodInfo>();
        }
    }
} 