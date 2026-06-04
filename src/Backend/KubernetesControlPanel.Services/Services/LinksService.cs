using KubernetesControlPanel.Core.Configuration;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace KubernetesControlPanel.Services.Services;

public class LinksService : ILinksService
{
    private readonly ExternalLinksConfig _config;

    public LinksService(IOptions<ExternalLinksConfig> config)
    {
        _config = config.Value;
    }

    public ExternalLinksConfig GetExternalLinks() => _config;
}
