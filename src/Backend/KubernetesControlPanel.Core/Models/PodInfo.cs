namespace KubernetesControlPanel.Core.Models;

/// <summary>
/// Represents information about a Kubernetes pod
/// </summary>
public class PodInfo
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
    /// Pod status (Running, Pending, Failed, etc.)
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Pod phase
    /// </summary>
    public string Phase { get; set; } = string.Empty;

    /// <summary>
    /// Pod IP address
    /// </summary>
    public string? PodIP { get; set; }

    /// <summary>
    /// Node name where the pod is running
    /// </summary>
    public string? NodeName { get; set; }

    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreationTimestamp { get; set; }

    /// <summary>
    /// Container information
    /// </summary>
    public List<ContainerInfo> Containers { get; set; } = new();

    /// <summary>
    /// Pod labels
    /// </summary>
    public Dictionary<string, string> Labels { get; set; } = new();

    /// <summary>
    /// Pod annotations
    /// </summary>
    public Dictionary<string, string> Annotations { get; set; } = new();

    /// <summary>
    /// Restart count
    /// </summary>
    public int RestartCount { get; set; }

    /// <summary>
    /// Ready status
    /// </summary>
    public bool IsReady { get; set; }

    /// <summary>
    /// Resource requests
    /// </summary>
    public ResourceRequirements? Requests { get; set; }

    /// <summary>
    /// Resource limits
    /// </summary>
    public ResourceRequirements? Limits { get; set; }
}

/// <summary>
/// Represents container information within a pod
/// </summary>
public class ContainerInfo
{
    /// <summary>
    /// Container name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Container image
    /// </summary>
    public string Image { get; set; } = string.Empty;

    /// <summary>
    /// Container status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Container ready status
    /// </summary>
    public bool Ready { get; set; }

    /// <summary>
    /// Restart count
    /// </summary>
    public int RestartCount { get; set; }

    /// <summary>
    /// Container state
    /// </summary>
    public string State { get; set; } = string.Empty;
}

/// <summary>
/// Represents resource requirements (CPU and Memory)
/// </summary>
public class ResourceRequirements
{
    /// <summary>
    /// CPU request/limit
    /// </summary>
    public string? Cpu { get; set; }

    /// <summary>
    /// Memory request/limit
    /// </summary>
    public string? Memory { get; set; }
} 