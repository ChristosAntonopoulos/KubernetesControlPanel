namespace KubernetesControlPanel.Core.Configuration;

public class ExternalLinksConfig
{
    public const string SectionName = "ExternalLinks";

    public List<ExternalLinkCategory> Categories { get; set; } = new();
}

public class ExternalLinkCategory
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "Link";
    public List<ExternalLinkItem> Links { get; set; } = new();
}

public class ExternalLinkItem
{
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "OpenInNew";
    public bool OpenInNewTab { get; set; } = true;
    public List<string> Tags { get; set; } = new();
}
