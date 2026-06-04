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
    public List<AccessEndpointHint> EndpointHints { get; set; } = new();
    public Dictionary<string, string> Labels { get; set; } = new();
}

/// <summary>
/// Manual access details when a clickable URL could not be built (e.g. NodePort without a detected host).
/// </summary>
public class AccessEndpointHint
{
    public string ServiceName { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public int NodePort { get; set; }
    public string? Host { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class AccessUrl
{
    public string Url { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public bool OpenInNewTab { get; set; } = true;
}
