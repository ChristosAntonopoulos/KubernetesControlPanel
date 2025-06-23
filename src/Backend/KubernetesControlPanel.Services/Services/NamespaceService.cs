using k8s;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace KubernetesControlPanel.Services.Services;

/// <summary>
/// Service for namespace operations
/// </summary>
public class NamespaceService : INamespaceService
{
    private readonly IKubernetesService _kubernetesService;
    private readonly IKubernetes _kubernetesClient;
    private readonly ILogger<NamespaceService> _logger;

    public NamespaceService(
        IKubernetesService kubernetesService,
        IKubernetes kubernetesClient,
        ILogger<NamespaceService> logger)
    {
        _kubernetesService = kubernetesService;
        _kubernetesClient = kubernetesClient;
        _logger = logger;
    }

    public async Task<List<string>> GetAllNamespacesAsync()
    {
        try
        {
            return await _kubernetesService.GetAllNamespacesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all namespaces");
            throw;
        }
    }

    public async Task<NamespacePodCount?> GetNamespaceDetailsAsync(string namespaceName)
    {
        try
        {
            return await _kubernetesService.GetNamespaceDetailsAsync(namespaceName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting namespace details for {Namespace}", namespaceName);
            return null;
        }
    }

    public async Task<List<ClusterEvent>> GetNamespaceEventsAsync(string namespaceName)
    {
        try
        {
            var events = await _kubernetesClient.CoreV1.ListNamespacedEventAsync(namespaceName);

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
            _logger.LogError(ex, "Error getting events for namespace {Namespace}", namespaceName);
            return new List<ClusterEvent>();
        }
    }

    public async Task<object> GetNamespaceResourceQuotasAsync(string namespaceName)
    {
        try
        {
            var resourceQuotas = await _kubernetesClient.CoreV1.ListNamespacedResourceQuotaAsync(namespaceName);
            
            // Return a simplified representation of resource quotas
            return new
            {
                ResourceQuotas = resourceQuotas.Items.Select(rq => new
                {
                    Name = rq.Metadata?.Name,
                    Spec = rq.Spec?.Hard?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.ToString()),
                    Status = rq.Status?.Used?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.ToString())
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resource quotas for namespace {Namespace}", namespaceName);
            return new { ResourceQuotas = new List<object>() };
        }
    }
} 