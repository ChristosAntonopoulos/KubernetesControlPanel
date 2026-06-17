using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

public interface IAppDiscoveryService
{
    Task<AppListResponse> GetAppsAsync();
    Task<DiscoveredApp?> GetAppAsync(string ns, string appKey);
    Task<AppAdminDetail?> GetAppAdminAsync(string ns, string appKey);
}
