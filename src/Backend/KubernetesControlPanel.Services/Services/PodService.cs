using k8s;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace KubernetesControlPanel.Services.Services;

/// <summary>
/// Service for pod operations
/// </summary>
public class PodService : IPodService
{
    private readonly IKubernetesService _kubernetesService;
    private readonly IKubernetes _kubernetesClient;
    private readonly ILogger<PodService> _logger;

    public PodService(
        IKubernetesService kubernetesService,
        IKubernetes kubernetesClient,
        ILogger<PodService> logger)
    {
        _kubernetesService = kubernetesService;
        _kubernetesClient = kubernetesClient;
        _logger = logger;
    }

    public async Task<List<PodInfo>> GetAllPodsAsync()
    {
        try
        {
            return await _kubernetesService.GetAllPodsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all pods");
            throw;
        }
    }

    public async Task<List<PodInfo>> GetPodsByNamespaceAsync(string namespaceName)
    {
        try
        {
            return await _kubernetesService.GetPodsByNamespaceAsync(namespaceName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pods for namespace {Namespace}", namespaceName);
            throw;
        }
    }

    public async Task<PodInfo?> GetPodDetailsAsync(string namespaceName, string podName)
    {
        try
        {
            return await _kubernetesService.GetPodDetailsAsync(namespaceName, podName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pod details for {PodName} in namespace {Namespace}", podName, namespaceName);
            return null;
        }
    }

    public async Task<string> GetPodLogsAsync(string namespaceName, string podName, string? containerName = null, int? tailLines = null)
    {
        try
        {
            return await _kubernetesService.GetPodLogsAsync(namespaceName, podName, containerName, tailLines);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting logs for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return $"Error retrieving logs: {ex.Message}";
        }
    }

    public async Task<List<ClusterEvent>> GetPodEventsAsync(string namespaceName, string podName)
    {
        try
        {
            var events = await _kubernetesClient.CoreV1.ListNamespacedEventAsync(
                namespaceName,
                fieldSelector: $"involvedObject.name={podName},involvedObject.kind=Pod");

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
            _logger.LogError(ex, "Error getting events for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return new List<ClusterEvent>();
        }
    }

    public async Task<bool> RestartPodAsync(string namespaceName, string podName)
    {
        try
        {
            // Delete the pod to trigger a restart (assuming it's managed by a deployment/replicaset)
            await _kubernetesClient.CoreV1.DeleteNamespacedPodAsync(podName, namespaceName);
            _logger.LogInformation("Pod {PodName} in namespace {Namespace} restarted successfully", podName, namespaceName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restarting pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return false;
        }
    }

    public async Task<bool> DeletePodAsync(string namespaceName, string podName)
    {
        try
        {
            await _kubernetesClient.CoreV1.DeleteNamespacedPodAsync(podName, namespaceName);
            _logger.LogInformation("Pod {PodName} in namespace {Namespace} deleted successfully", podName, namespaceName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return false;
        }
    }
} 