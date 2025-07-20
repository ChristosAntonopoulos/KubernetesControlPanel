using k8s;
using k8s.Models;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System.Text;

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
            throw;
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
            throw;
        }
    }

    public async Task<string> GetPodPreviousLogsAsync(string namespaceName, string podName, string? containerName = null, int? tailLines = null)
    {
        try
        {
            var logOptions = new V1PodLogOptions
            {
                Previous = true,
                TailLines = tailLines
            };

            if (!string.IsNullOrEmpty(containerName))
            {
                logOptions.Container = containerName;
            }

            using var response = await _kubernetesClient.CoreV1.ReadNamespacedPodLogWithHttpMessagesAsync(
                podName, namespaceName, logOptions: logOptions);
            
            using var reader = new StreamReader(response.Body);
            return await reader.ReadToEndAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting previous logs for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return string.Empty;
        }
    }

    public async Task<List<ClusterEvent>> GetPodEventsAsync(string namespaceName, string podName)
    {
        try
        {
            var events = await _kubernetesClient.CoreV1.ListNamespacedEventAsync(namespaceName);
            return events.Items
                .Where(e => e.InvolvedObject?.Name == podName && e.InvolvedObject?.Kind == "Pod")
                .Select(e => new ClusterEvent
                {
                    Type = e.Type ?? "",
                    Reason = e.Reason ?? "",
                    Message = e.Message ?? "",
                    Timestamp = e.LastTimestamp ?? DateTime.MinValue,
                    InvolvedObjectKind = e.InvolvedObject?.Kind ?? "",
                    InvolvedObjectName = e.InvolvedObject?.Name ?? "",
                    Namespace = e.Metadata?.NamespaceProperty ?? ""
                })
                .OrderByDescending(e => e.Timestamp)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return new List<ClusterEvent>();
        }
    }

    public async Task<KubernetesControlPanel.Core.Models.PodMetrics?> GetPodMetricsAsync(string namespaceName, string podName)
    {
        try
        {
            // Note: This requires metrics-server to be installed in the cluster
            // For now, return a basic metrics structure since metrics-server integration is complex
            var podMetrics = new KubernetesControlPanel.Core.Models.PodMetrics
            {
                Name = podName,
                Namespace = namespaceName,
                Timestamp = DateTime.UtcNow,
                Containers = new List<KubernetesControlPanel.Core.Models.ContainerMetrics>()
            };

            // In a real implementation, you would:
            // 1. Use the metrics.k8s.io API
            // 2. Parse the actual metrics data
            // 3. Populate CPU and memory usage
            
            return podMetrics;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not get metrics for pod {PodName} in namespace {Namespace}. Make sure metrics-server is installed.", podName, namespaceName);
            return null;
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

    public async Task<PodRestartResult> RestartPodWithLogsAsync(string namespaceName, string podName)
    {
        var result = new PodRestartResult
        {
            PodName = podName,
            Namespace = namespaceName,
            RestartTimestamp = DateTime.UtcNow
        };

        try
        {
            // Get the current pod to capture its UID
            var currentPod = await _kubernetesClient.CoreV1.ReadNamespacedPodAsync(podName, namespaceName);
            result.PreviousPodUid = currentPod.Metadata?.Uid;

            // Capture logs from all containers before restart
            foreach (var container in currentPod.Spec?.Containers ?? new List<V1Container>())
            {
                try
                {
                    var containerLogs = await GetPodLogsAsync(namespaceName, podName, container.Name, 1000);
                    result.ContainerPreRestartLogs[container.Name] = containerLogs;
                }
                catch (Exception logEx)
                {
                    _logger.LogWarning(logEx, "Could not capture logs for container {ContainerName} in pod {PodName}", container.Name, podName);
                }
            }

            // Capture all logs (main container)
            result.PreRestartLogs = await GetPodLogsAsync(namespaceName, podName, null, 1000);

            // Perform the restart
            await _kubernetesClient.CoreV1.DeleteNamespacedPodAsync(podName, namespaceName);

            // Wait a bit for the new pod to be created
            await Task.Delay(2000);

            // Try to get the new pod UID
            try
            {
                var newPod = await _kubernetesClient.CoreV1.ReadNamespacedPodAsync(podName, namespaceName);
                result.NewPodUid = newPod.Metadata?.Uid;
            }
            catch
            {
                // New pod might not be ready yet, which is okay
            }

            result.Success = true;
            _logger.LogInformation("Pod {PodName} in namespace {Namespace} restarted successfully with logs preserved", podName, namespaceName);
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = ex.Message;
            _logger.LogError(ex, "Error restarting pod {PodName} in namespace {Namespace} with log preservation", podName, namespaceName);
        }

        return result;
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

    public async Task<List<PodResourceUsage>> GetPodResourceHistoryAsync(string namespaceName, string podName, int hours = 24)
    {
        try
        {
            // This is a simplified implementation
            // In a real scenario, you would store metrics in a time-series database
            // For now, we'll return a simulated history
            var history = new List<PodResourceUsage>();
            var endTime = DateTime.UtcNow;
            var startTime = endTime.AddHours(-hours);

            // Simulate historical data (replace with actual metrics storage)
            for (var time = startTime; time <= endTime; time = time.AddMinutes(5))
            {
                var usage = new PodResourceUsage
                {
                    Timestamp = time,
                    PodName = podName,
                    Namespace = namespaceName,
                    CpuUsage = Random.Shared.Next(100, 500), // millicores
                    MemoryUsage = Random.Shared.Next(100 * 1024 * 1024, 500 * 1024 * 1024), // bytes
                    CpuUsagePercentage = Random.Shared.NextDouble() * 100,
                    MemoryUsagePercentage = Random.Shared.NextDouble() * 100
                };
                history.Add(usage);
            }

            return history.OrderBy(h => h.Timestamp).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resource history for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return new List<PodResourceUsage>();
        }
    }
} 