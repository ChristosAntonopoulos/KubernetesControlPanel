namespace KubernetesControlPanel.Core.Models;

/// <summary>
/// Represents information about a Kubernetes node
/// </summary>
public class NodeInfo
{
    /// <summary>
    /// Node name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Node status (Ready, NotReady, etc.)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Node role (master, worker, etc.)
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Node IP address
    /// </summary>
    public string? InternalIP { get; set; }

    /// <summary>
    /// External IP address
    /// </summary>
    public string? ExternalIP { get; set; }

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreationTimestamp { get; set; }

    /// <summary>
    /// Node labels
    /// </summary>
    public Dictionary<string, string> Labels { get; set; } = new();

    /// <summary>
    /// Node annotations
    /// </summary>
    public Dictionary<string, string> Annotations { get; set; } = new();

    /// <summary>
    /// Node capacity
    /// </summary>
    public NodeResources? Capacity { get; set; }

    /// <summary>
    /// Node allocatable resources
    /// </summary>
    public NodeResources? Allocatable { get; set; }

    /// <summary>
    /// Node conditions
    /// </summary>
    public List<NodeCondition> Conditions { get; set; } = new();

    /// <summary>
    /// Kubernetes version
    /// </summary>
    public string? KubernetesVersion { get; set; }

    /// <summary>
    /// Operating system
    /// </summary>
    public string? OperatingSystem { get; set; }

    /// <summary>
    /// Architecture
    /// </summary>
    public string? Architecture { get; set; }

    /// <summary>
    /// Container runtime
    /// </summary>
    public string? ContainerRuntime { get; set; }

    /// <summary>
    /// Current CPU usage in millicores (from metrics-server when available).
    /// </summary>
    public long? CpuUsageMillicores { get; set; }

    /// <summary>
    /// Current memory usage in bytes (from metrics-server when available).
    /// </summary>
    public long? MemoryUsageBytes { get; set; }
}

/// <summary>
/// Represents node resources (CPU and Memory)
/// </summary>
public class NodeResources
{
    /// <summary>
    /// CPU capacity/allocatable
    /// </summary>
    public string? Cpu { get; set; }

    /// <summary>
    /// Memory capacity/allocatable
    /// </summary>
    public string? Memory { get; set; }

    /// <summary>
    /// Number of pods
    /// </summary>
    public string? Pods { get; set; }

    /// <summary>
    /// Number of ephemeral storage
    /// </summary>
    public string? EphemeralStorage { get; set; }
}

/// <summary>
/// Represents node conditions
/// </summary>
public class NodeCondition
{
    /// <summary>
    /// Condition type
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Condition status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Last heartbeat time
    /// </summary>
    public DateTime? LastHeartbeatTime { get; set; }

    /// <summary>
    /// Last transition time
    /// </summary>
    public DateTime? LastTransitionTime { get; set; }

    /// <summary>
    /// Reason for the condition
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Human-readable message
    /// </summary>
    public string? Message { get; set; }
} 