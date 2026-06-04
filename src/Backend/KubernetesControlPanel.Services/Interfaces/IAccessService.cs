using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

public interface IAccessService
{
    Task<ClusterAccessOverview> GetClusterAccessAsync();
}
