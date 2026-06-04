namespace KubernetesControlPanel.Core.Models;

public class ClusterAccessOverview
{
    public List<AccessNamespaceGroup> Namespaces { get; set; } = new();
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

public class AccessNamespaceGroup
{
    public string Namespace { get; set; } = string.Empty;
    public bool IsSystemNamespace { get; set; }
    public List<AccessAppEntry> Apps { get; set; } = new();
}

public class AccessAppEntry
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? StatusDetail { get; set; }
    public List<AccessUrl> Urls { get; set; } = new();
    public string? NoUrlReason { get; set; }
    public Dictionary<string, string> Labels { get; set; } = new();
}

public class AccessUrl
{
    public string Url { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public bool OpenInNewTab { get; set; } = true;
}
