namespace KubernetesControlPanel.Core.Models;

/// <summary>
/// Represents dashboard overview information
/// </summary>
public class DashboardInfo
{
    /// <summary>
    /// Cluster name
    /// </summary>
    public string ClusterName { get; set; } = string.Empty;

    /// <summary>
    /// Kubernetes version
    /// </summary>
    public string KubernetesVersion { get; set; } = string.Empty;

    /// <summary>
    /// Cluster health status
    /// </summary>
    public string HealthStatus { get; set; } = string.Empty;

    /// <summary>
    /// Total number of nodes
    /// </summary>
    public int TotalNodes { get; set; }

    /// <summary>
    /// Number of ready nodes
    /// </summary>
    public int ReadyNodes { get; set; }

    /// <summary>
    /// Total number of pods
    /// </summary>
    public int TotalPods { get; set; }

    /// <summary>
    /// Number of running pods
    /// </summary>
    public int RunningPods { get; set; }

    /// <summary>
    /// Number of pending pods
    /// </summary>
    public int PendingPods { get; set; }

    /// <summary>
    /// Number of failed pods
    /// </summary>
    public int FailedPods { get; set; }

    /// <summary>
    /// Total number of namespaces
    /// </summary>
    public int TotalNamespaces { get; set; }

    /// <summary>
    /// Pod status breakdown
    /// </summary>
    public Dictionary<string, int> PodStatusBreakdown { get; set; } = new();

    /// <summary>
    /// Node status breakdown
    /// </summary>
    public Dictionary<string, int> NodeStatusBreakdown { get; set; } = new();

    /// <summary>
    /// Namespace pod distribution
    /// </summary>
    public List<NamespacePodCount> NamespacePodDistribution { get; set; } = new();

    /// <summary>
    /// Recent events
    /// </summary>
    public List<ClusterEvent> RecentEvents { get; set; } = new();

    /// <summary>
    /// Resource usage summary
    /// </summary>
    public ResourceUsageSummary ResourceUsage { get; set; } = new();

    /// <summary>
    /// Last updated timestamp
    /// </summary>
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Represents namespace pod count
/// </summary>
public class NamespacePodCount
{
    /// <summary>
    /// Namespace name
    /// </summary>
    public string Namespace { get; set; } = string.Empty;

    /// <summary>
    /// Number of pods in the namespace
    /// </summary>
    public int PodCount { get; set; }

    /// <summary>
    /// Number of running pods
    /// </summary>
    public int RunningPods { get; set; }

    /// <summary>
    /// Number of failed pods
    /// </summary>
    public int FailedPods { get; set; }
}

/// <summary>
/// Represents a cluster event
/// </summary>
public class ClusterEvent
{
    /// <summary>
    /// Event type
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Event reason
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Event message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Event timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Involved object kind
    /// </summary>
    public string InvolvedObjectKind { get; set; } = string.Empty;

    /// <summary>
    /// Involved object name
    /// </summary>
    public string InvolvedObjectName { get; set; } = string.Empty;

    /// <summary>
    /// Namespace
    /// </summary>
    public string Namespace { get; set; } = string.Empty;
}

/// <summary>
/// Represents resource usage summary
/// </summary>
public class ResourceUsageSummary
{
    /// <summary>
    /// CPU usage percentage
    /// </summary>
    public double CpuUsagePercentage { get; set; }

    /// <summary>
    /// Memory usage percentage
    /// </summary>
    public double MemoryUsagePercentage { get; set; }

    /// <summary>
    /// Total CPU capacity
    /// </summary>
    public string TotalCpu { get; set; } = string.Empty;

    /// <summary>
    /// Total memory capacity
    /// </summary>
    public string TotalMemory { get; set; } = string.Empty;

    /// <summary>
    /// Used CPU
    /// </summary>
    public string UsedCpu { get; set; } = string.Empty;

    /// <summary>
    /// Used memory
    /// </summary>
    public string UsedMemory { get; set; } = string.Empty;

    /// <summary>
    /// True when values are from metrics-server; false when metrics are unavailable (e.g. metrics-server not installed).
    /// </summary>
    public bool MetricsAvailable { get; set; } = true;
} 