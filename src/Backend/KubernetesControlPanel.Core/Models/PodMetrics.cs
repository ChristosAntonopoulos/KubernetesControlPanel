namespace KubernetesControlPanel.Core.Models;

/// <summary>
/// Represents pod resource metrics
/// </summary>
public class PodMetrics
{
    /// <summary>
    /// Pod name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Pod namespace
    /// </summary>
    public string Namespace { get; set; } = string.Empty;

    /// <summary>
    /// Container metrics
    /// </summary>
    public List<ContainerMetrics> Containers { get; set; } = new();

    /// <summary>
    /// Timestamp when metrics were collected
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Total CPU usage across all containers (in millicores)
    /// </summary>
    public long TotalCpuUsage { get; set; }

    /// <summary>
    /// Total memory usage across all containers (in bytes)
    /// </summary>
    public long TotalMemoryUsage { get; set; }
}

/// <summary>
/// Represents container resource metrics
/// </summary>
public class ContainerMetrics
{
    /// <summary>
    /// Container name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// CPU usage in millicores
    /// </summary>
    public long CpuUsage { get; set; }

    /// <summary>
    /// Memory usage in bytes
    /// </summary>
    public long MemoryUsage { get; set; }

    /// <summary>
    /// CPU requests in millicores
    /// </summary>
    public long? CpuRequests { get; set; }

    /// <summary>
    /// Memory requests in bytes
    /// </summary>
    public long? MemoryRequests { get; set; }

    /// <summary>
    /// CPU limits in millicores
    /// </summary>
    public long? CpuLimits { get; set; }

    /// <summary>
    /// Memory limits in bytes
    /// </summary>
    public long? MemoryLimits { get; set; }
}