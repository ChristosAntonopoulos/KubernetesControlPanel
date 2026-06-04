using KubernetesControlPanel.Core.Configuration;

namespace KubernetesControlPanel.Services.Interfaces;

public interface ILinksService
{
    ExternalLinksConfig GetExternalLinks();
}
