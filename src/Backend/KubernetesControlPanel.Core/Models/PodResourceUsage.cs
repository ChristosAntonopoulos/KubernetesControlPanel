namespace KubernetesControlPanel.Core.Models;

/// <summary>
/// Represents historical resource usage for a pod
/// </summary>
public class PodResourceUsage
{
    /// <summary>
    /// Timestamp of the measurement
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Pod name
    /// </summary>
    public string PodName { get; set; } = string.Empty;

    /// <summary>
    /// Pod namespace
    /// </summary>
    public string Namespace { get; set; } = string.Empty;

    /// <summary>
    /// CPU usage in millicores
    /// </summary>
    public long CpuUsage { get; set; }

    /// <summary>
    /// Memory usage in bytes
    /// </summary>
    public long MemoryUsage { get; set; }

    /// <summary>
    /// Network received bytes
    /// </summary>
    public long? NetworkRxBytes { get; set; }

    /// <summary>
    /// Network transmitted bytes
    /// </summary>
    public long? NetworkTxBytes { get; set; }

    /// <summary>
    /// Filesystem usage in bytes
    /// </summary>
    public long? FilesystemUsage { get; set; }

    /// <summary>
    /// CPU usage percentage based on requests
    /// </summary>
    public double? CpuUsagePercentage { get; set; }

    /// <summary>
    /// Memory usage percentage based on requests
    /// </summary>
    public double? MemoryUsagePercentage { get; set; }
}