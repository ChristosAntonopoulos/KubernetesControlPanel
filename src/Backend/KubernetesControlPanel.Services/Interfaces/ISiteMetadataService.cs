namespace KubernetesControlPanel.Services.Interfaces;

public class SiteMetadata
{
    public string? Title { get; set; }
    public string? FaviconUrl { get; set; }
}

public interface ISiteMetadataService
{
    Task<SiteMetadata?> FetchAsync(string url, CancellationToken cancellationToken = default);
}
