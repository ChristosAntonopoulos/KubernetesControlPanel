namespace KubernetesControlPanel.Core.Models;

/// <summary>
/// Represents the result of a pod restart operation with preserved logs
/// </summary>
public class PodRestartResult
{
    /// <summary>
    /// Whether the restart was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Pod name
    /// </summary>
    public string PodName { get; set; } = string.Empty;

    /// <summary>
    /// Pod namespace
    /// </summary>
    public string Namespace { get; set; } = string.Empty;

    /// <summary>
    /// Logs from before the restart
    /// </summary>
    public string PreRestartLogs { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when restart was initiated
    /// </summary>
    public DateTime RestartTimestamp { get; set; }

    /// <summary>
    /// Error message if restart failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Previous pod UID (before restart)
    /// </summary>
    public string? PreviousPodUid { get; set; }

    /// <summary>
    /// New pod UID (after restart)
    /// </summary>
    public string? NewPodUid { get; set; }

    /// <summary>
    /// Container logs from before restart, indexed by container name
    /// </summary>
    public Dictionary<string, string> ContainerPreRestartLogs { get; set; } = new();
}