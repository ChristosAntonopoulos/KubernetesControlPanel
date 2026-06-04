namespace KubernetesControlPanel.Core.Models;

/// <summary>
/// Kubernetes deployment summary for scaling UI
/// </summary>
public class DeploymentInfo
{
    public string Name { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public int Replicas { get; set; }
    public int ReadyReplicas { get; set; }
    public int AvailableReplicas { get; set; }
    public int UpdatedReplicas { get; set; }
    public DateTime CreationTimestamp { get; set; }
    public Dictionary<string, string> Labels { get; set; } = new();
    public string Status { get; set; } = string.Empty;
}

public class ScaleDeploymentRequest
{
    public int Replicas { get; set; }
}

public class ScaleDeploymentResult
{
    public bool Success { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public int PreviousReplicas { get; set; }
    public int NewReplicas { get; set; }
    public string? ErrorMessage { get; set; }
}
