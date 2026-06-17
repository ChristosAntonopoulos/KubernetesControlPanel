namespace KubernetesControlPanel.Core.Models;

public class AppListResponse
{
    public List<DiscoveredApp> Apps { get; set; } = new();
    public AppSummaryStats Summary { get; set; } = new();
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class AppSummaryStats
{
    public int Total { get; set; }
    public int Healthy { get; set; }
    public int Degraded { get; set; }
    public int Offline { get; set; }
    public int Starting { get; set; }
    public int Unknown { get; set; }
}

public class DiscoveredApp
{
    public string AppKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public string UserStatus { get; set; } = "Unknown";
    public string AdminStatus { get; set; } = string.Empty;
    public string? StatusReason { get; set; }
    public int ReadyComponents { get; set; }
    public int TotalComponents { get; set; }
    public int ReadyPods { get; set; }
    public int TotalPods { get; set; }
    public string? PrimaryUrl { get; set; }
    public List<AppUrl> Urls { get; set; } = new();
    public List<AppComponent> Components { get; set; } = new();
    public bool IsSystem { get; set; }
    public DateTime? LastChange { get; set; }
    public string? Icon { get; set; }
    public string AccentColor { get; set; } = "#2563eb";
    public List<string> Tags { get; set; } = new();
    public Dictionary<string, string> Labels { get; set; } = new();
    public string? AvailabilitySummary { get; set; }
}

public class AppComponent
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Deployment";
    public string UserStatus { get; set; } = "Unknown";
    public string AdminStatus { get; set; } = string.Empty;
    public int ReadyReplicas { get; set; }
    public int TotalReplicas { get; set; }
}

public class AppUrl
{
    public string Url { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public bool OpenInNewTab { get; set; } = true;
}

public class AppAdminDetail
{
    public DiscoveredApp App { get; set; } = new();
    public AppAdminOverview Overview { get; set; } = new();
    public List<AppWorkloadInfo> Workloads { get; set; } = new();
    public List<PodInfo> Pods { get; set; } = new();
    public List<AppServiceInfo> Services { get; set; } = new();
    public List<AppIngressInfo> Ingresses { get; set; } = new();
    public List<ClusterEvent> RecentEvents { get; set; } = new();
    public int RestartsLast24Hours { get; set; }
}

public class AppAdminOverview
{
    public string Headline { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? AffectedComponent { get; set; }
    public string? RecentWarning { get; set; }
    public List<string> SuggestedSteps { get; set; } = new();
}

public class AppWorkloadInfo
{
    public string Name { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Replicas { get; set; }
    public int ReadyReplicas { get; set; }
    public string Image { get; set; } = string.Empty;
    public DateTime CreationTimestamp { get; set; }
}

public class AppServiceInfo
{
    public string Name { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ClusterIP { get; set; }
    public string Ports { get; set; } = string.Empty;
    public string Selector { get; set; } = string.Empty;
    public int MatchedPods { get; set; }
}

public class AppIngressInfo
{
    public string Name { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public string Path { get; set; } = "/";
    public string Service { get; set; } = string.Empty;
    public int? Port { get; set; }
    public bool TlsEnabled { get; set; }
    public string? IngressClass { get; set; }
    public string? ExternalIP { get; set; }
}

public class RestartDeploymentResult
{
    public bool Success { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}

public class ResourceYamlResult
{
    public string Kind { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public string Yaml { get; set; } = string.Empty;
}
