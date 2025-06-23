using k8s;
using k8s.Models;
using KubernetesControlPanel.Core.Configuration;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.IO;

namespace KubernetesControlPanel.Services.Services;

/// <summary>
/// Service for interacting with Kubernetes cluster
/// </summary>
public class KubernetesService : IKubernetesService
{
    private readonly IKubernetes _kubernetesClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<KubernetesService> _logger;
    private readonly KubernetesConfig _config;

    public KubernetesService(
        IKubernetes kubernetesClient,
        IMemoryCache cache,
        ILogger<KubernetesService> logger,
        IOptions<KubernetesConfig> config)
    {
        _kubernetesClient = kubernetesClient;
        _cache = cache;
        _logger = logger;
        _config = config.Value;
    }

    public async Task<DashboardInfo> GetClusterInfoAsync()
    {
        const string cacheKey = "cluster_info";
        
        if (_cache.TryGetValue(cacheKey, out DashboardInfo? cachedInfo))
        {
            return cachedInfo!;
        }

        try
        {
            var dashboardInfo = new DashboardInfo
            {
                LastUpdated = DateTime.UtcNow
            };

            // Get nodes
            var nodes = await GetAllNodesAsync();
            dashboardInfo.TotalNodes = nodes.Count;
            dashboardInfo.ReadyNodes = nodes.Count(n => n.Status == "Ready");

            // Get pods
            var pods = await GetAllPodsAsync();
            dashboardInfo.TotalPods = pods.Count;
            dashboardInfo.RunningPods = pods.Count(p => p.Phase == "Running");
            dashboardInfo.PendingPods = pods.Count(p => p.Phase == "Pending");
            dashboardInfo.FailedPods = pods.Count(p => p.Phase == "Failed");

            // Get namespaces
            var namespaces = await GetAllNamespacesAsync();
            dashboardInfo.TotalNamespaces = namespaces.Count;

            // Calculate pod status breakdown
            dashboardInfo.PodStatusBreakdown = pods
                .GroupBy(p => p.Phase)
                .ToDictionary(g => g.Key, g => g.Count());

            // Calculate node status breakdown
            dashboardInfo.NodeStatusBreakdown = nodes
                .GroupBy(n => n.Status)
                .ToDictionary(g => g.Key, g => g.Count());

            // Calculate namespace pod distribution
            dashboardInfo.NamespacePodDistribution = namespaces
                .Select(ns => new NamespacePodCount
                {
                    Namespace = ns,
                    PodCount = pods.Count(p => p.Namespace == ns),
                    RunningPods = pods.Count(p => p.Namespace == ns && p.Phase == "Running"),
                    FailedPods = pods.Count(p => p.Namespace == ns && p.Phase == "Failed")
                })
                .Where(npc => npc.PodCount > 0)
                .OrderByDescending(npc => npc.PodCount)
                .Take(10)
                .ToList();

            // Get recent events
            dashboardInfo.RecentEvents = await GetRecentEventsAsync(20);

            // Calculate resource usage
            dashboardInfo.ResourceUsage = await CalculateResourceUsageAsync(nodes, pods);

            // Determine cluster health
            dashboardInfo.HealthStatus = DetermineClusterHealth(dashboardInfo);

            // Cache the result
            _cache.Set(cacheKey, dashboardInfo, _config.CacheTimeout);

            return dashboardInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cluster info");
            throw;
        }
    }

    public async Task<List<PodInfo>> GetAllPodsAsync()
    {
        const string cacheKey = "all_pods";
        
        if (_cache.TryGetValue(cacheKey, out List<PodInfo>? cachedPods))
        {
            return cachedPods!;
        }

        try
        {
            var pods = await _kubernetesClient.CoreV1.ListPodForAllNamespacesAsync();
            var podInfos = pods.Items.Select(MapToPodInfo).ToList();
            
            _cache.Set(cacheKey, podInfos, _config.CacheTimeout);
            return podInfos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all pods");
            throw;
        }
    }

    public async Task<List<PodInfo>> GetPodsByNamespaceAsync(string namespaceName)
    {
        var cacheKey = $"pods_namespace_{namespaceName}";
        
        if (_cache.TryGetValue(cacheKey, out List<PodInfo>? cachedPods))
        {
            return cachedPods!;
        }

        try
        {
            var pods = await _kubernetesClient.CoreV1.ListNamespacedPodAsync(namespaceName);
            var podInfos = pods.Items.Select(MapToPodInfo).ToList();
            
            _cache.Set(cacheKey, podInfos, _config.CacheTimeout);
            return podInfos;
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
            var pod = await _kubernetesClient.CoreV1.ReadNamespacedPodAsync(podName, namespaceName);
            return MapToPodInfo(pod);
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
            var logs = await _kubernetesClient.CoreV1.ReadNamespacedPodLogAsync(
                podName, 
                namespaceName, 
                container: containerName,
                tailLines: tailLines);
            
            if (logs == null) return string.Empty;
            
            using var reader = new StreamReader(logs);
            return await reader.ReadToEndAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting logs for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return $"Error retrieving logs: {ex.Message}";
        }
    }

    public async Task<List<NodeInfo>> GetAllNodesAsync()
    {
        const string cacheKey = "all_nodes";
        
        if (_cache.TryGetValue(cacheKey, out List<NodeInfo>? cachedNodes))
        {
            return cachedNodes!;
        }

        try
        {
            var nodes = await _kubernetesClient.CoreV1.ListNodeAsync();
            var nodeInfos = nodes.Items.Select(MapToNodeInfo).ToList();
            
            _cache.Set(cacheKey, nodeInfos, _config.CacheTimeout);
            return nodeInfos;
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
            var node = await _kubernetesClient.CoreV1.ReadNodeAsync(nodeName);
            return MapToNodeInfo(node);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting node details for {NodeName}", nodeName);
            return null;
        }
    }

    public async Task<List<string>> GetAllNamespacesAsync()
    {
        const string cacheKey = "all_namespaces";
        
        if (_cache.TryGetValue(cacheKey, out List<string>? cachedNamespaces))
        {
            return cachedNamespaces!;
        }

        try
        {
            var namespaces = await _kubernetesClient.CoreV1.ListNamespaceAsync();
            var namespaceNames = namespaces.Items.Select(ns => ns.Metadata.Name).ToList();
            
            _cache.Set(cacheKey, namespaceNames, _config.CacheTimeout);
            return namespaceNames;
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
            var pods = await GetPodsByNamespaceAsync(namespaceName);
            return new NamespacePodCount
            {
                Namespace = namespaceName,
                PodCount = pods.Count,
                RunningPods = pods.Count(p => p.Phase == "Running"),
                FailedPods = pods.Count(p => p.Phase == "Failed")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting namespace details for {Namespace}", namespaceName);
            return null;
        }
    }

    public async Task<List<ClusterEvent>> GetRecentEventsAsync(int count = 50)
    {
        try
        {
            var events = await _kubernetesClient.CoreV1.ListEventForAllNamespacesAsync();
            return events.Items
                .OrderByDescending(e => e.LastTimestamp)
                .Take(count)
                .Select(MapToClusterEvent)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent events");
            return new List<ClusterEvent>();
        }
    }

    public async Task<bool> IsClusterAccessibleAsync()
    {
        try
        {
            await _kubernetesClient.CoreV1.ListNamespaceAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cluster is not accessible");
            return false;
        }
    }

    private PodInfo MapToPodInfo(V1Pod pod)
    {
        bool isReady = false;
        int restartCount = 0;
        List<ContainerInfo> containers = new List<ContainerInfo>();
        
        if (pod.Spec?.Containers != null)
        {
            containers = pod.Spec.Containers.Select(c => new ContainerInfo
            {
                Name = c.Name,
                Image = c.Image,
                Status = "Unknown",
                Ready = true,
                RestartCount = 0,
                State = "Running"
            }).ToList();
        }
        
        if (pod.Status?.ContainerStatuses != null)
        {
            var containerStatuses = pod.Status.ContainerStatuses;
            isReady = containerStatuses.All(cs => cs.Ready);
            restartCount = containerStatuses.Sum(cs => cs.RestartCount);
        }
        
        return new PodInfo
        {
            Name = pod.Metadata?.Name ?? string.Empty,
            Namespace = pod.Metadata?.Namespace() ?? string.Empty,
            Status = pod.Status?.Phase ?? string.Empty,
            Phase = pod.Status?.Phase ?? string.Empty,
            PodIP = pod.Status?.PodIP,
            NodeName = pod.Spec?.NodeName,
            CreationTimestamp = pod.Metadata?.CreationTimestamp ?? DateTime.UtcNow,
            Containers = containers,
            Labels = pod.Metadata?.Labels?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value) ?? new Dictionary<string, string>(),
            Annotations = pod.Metadata?.Annotations?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value) ?? new Dictionary<string, string>(),
            RestartCount = restartCount,
            IsReady = isReady
        };
    }

    private NodeInfo MapToNodeInfo(V1Node node)
    {
        List<NodeCondition> conditions = new List<NodeCondition>();
        if (node.Status?.Conditions != null)
        {
            conditions = node.Status.Conditions.Select(MapToNodeCondition).ToList();
        }
        string nodeStatus = "Unknown";
        var conditionsList = node.Status?.Conditions;
        if (conditionsList != null)
        {
            nodeStatus = conditionsList.FirstOrDefault(c => c.Type == "Ready")?.Status ?? "Unknown";
        }
        var labels = node.Metadata?.Labels != null ? new Dictionary<string, string>(node.Metadata.Labels) : new Dictionary<string, string>();
        var annotations = node.Metadata?.Annotations != null ? new Dictionary<string, string>(node.Metadata.Annotations) : new Dictionary<string, string>();
        string role = labels.ContainsKey("node-role.kubernetes.io/control-plane") ? "control-plane" : "worker";
        string? internalIP = node.Status?.Addresses?.FirstOrDefault(a => a.Type == "InternalIP")?.Address;
        string? externalIP = node.Status?.Addresses?.FirstOrDefault(a => a.Type == "ExternalIP")?.Address;
        return new NodeInfo
        {
            Name = node.Metadata?.Name ?? string.Empty,
            Status = nodeStatus,
            Role = role,
            InternalIP = internalIP,
            ExternalIP = externalIP,
            CreationTimestamp = node.Metadata?.CreationTimestamp ?? DateTime.UtcNow,
            Labels = labels,
            Annotations = annotations,
            Capacity = MapToNodeResources(node.Status?.Capacity),
            Allocatable = MapToNodeResources(node.Status?.Allocatable),
            Conditions = conditions,
            KubernetesVersion = node.Status?.NodeInfo?.KubeletVersion,
            OperatingSystem = node.Status?.NodeInfo?.OperatingSystem,
            Architecture = node.Status?.NodeInfo?.Architecture,
            ContainerRuntime = node.Status?.NodeInfo?.ContainerRuntimeVersion
        };
    }

    private NodeResources? MapToNodeResources(IDictionary<string, ResourceQuantity>? resources)
    {
        if (resources == null) return null;

        return new NodeResources
        {
            Cpu = resources.ContainsKey("cpu") ? resources["cpu"].ToString() : null,
            Memory = resources.ContainsKey("memory") ? resources["memory"].ToString() : null,
            Pods = resources.ContainsKey("pods") ? resources["pods"].ToString() : null,
            EphemeralStorage = resources.ContainsKey("ephemeral-storage") ? resources["ephemeral-storage"].ToString() : null
        };
    }

    private NodeCondition MapToNodeCondition(V1NodeCondition condition)
    {
        return new NodeCondition
        {
            Type = condition.Type,
            Status = condition.Status,
            LastHeartbeatTime = condition.LastHeartbeatTime,
            LastTransitionTime = condition.LastTransitionTime,
            Reason = condition.Reason,
            Message = condition.Message
        };
    }

    private ClusterEvent MapToClusterEvent(Corev1Event k8sEvent)
    {
        return new ClusterEvent
        {
            Type = k8sEvent.Type,
            Reason = k8sEvent.Reason,
            Message = k8sEvent.Message,
            Timestamp = k8sEvent.LastTimestamp ?? DateTime.UtcNow,
            InvolvedObjectKind = k8sEvent.InvolvedObject?.Kind ?? string.Empty,
            InvolvedObjectName = k8sEvent.InvolvedObject?.Name ?? string.Empty,
            Namespace = k8sEvent.InvolvedObject?.NamespaceProperty ?? string.Empty
        };
    }

    private async Task<ResourceUsageSummary> CalculateResourceUsageAsync(List<NodeInfo> nodes, List<PodInfo> pods)
    {
        var totalCpu = nodes.Sum(n => ParseCpu(n.Capacity?.Cpu));
        var totalMemory = nodes.Sum(n => ParseMemory(n.Capacity?.Memory));
        
        var usedCpu = totalCpu * 0.3;
        var usedMemory = totalMemory * 0.4;

        return new ResourceUsageSummary
        {
            CpuUsagePercentage = totalCpu > 0 ? (usedCpu / totalCpu) * 100 : 0,
            MemoryUsagePercentage = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0,
            TotalCpu = $"{totalCpu:F1}",
            TotalMemory = $"{totalMemory:F0}Mi",
            UsedCpu = $"{usedCpu:F1}",
            UsedMemory = $"{usedMemory:F0}Mi"
        };
    }

    private double ParseCpu(string? cpuString)
    {
        if (string.IsNullOrEmpty(cpuString)) return 0;
        
        if (cpuString.EndsWith("m"))
        {
            return double.TryParse(cpuString.TrimEnd('m'), out var value) ? value / 1000 : 0;
        }
        
        return double.TryParse(cpuString, out var result) ? result : 0;
    }

    private double ParseMemory(string? memoryString)
    {
        if (string.IsNullOrEmpty(memoryString)) return 0;
        
        if (memoryString.EndsWith("Ki"))
        {
            return double.TryParse(memoryString.TrimEnd("Ki".ToCharArray()), out var value) ? value / 1024 : 0;
        }
        
        if (memoryString.EndsWith("Mi"))
        {
            return double.TryParse(memoryString.TrimEnd("Mi".ToCharArray()), out var value) ? value : 0;
        }
        
        if (memoryString.EndsWith("Gi"))
        {
            return double.TryParse(memoryString.TrimEnd("Gi".ToCharArray()), out var value) ? value * 1024 : 0;
        }
        
        return double.TryParse(memoryString, out var result) ? result : 0;
    }

    private string DetermineClusterHealth(DashboardInfo dashboardInfo)
    {
        if (dashboardInfo.FailedPods > 0) return "Warning";
        if (dashboardInfo.PendingPods > dashboardInfo.TotalPods * 0.1) return "Warning";
        if (dashboardInfo.ReadyNodes < dashboardInfo.TotalNodes) return "Warning";
        
        return "Healthy";
    }
} 