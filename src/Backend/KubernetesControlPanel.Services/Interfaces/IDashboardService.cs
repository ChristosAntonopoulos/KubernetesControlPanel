using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

/// <summary>
/// Interface for dashboard operations
/// </summary>
public interface IDashboardService
{
    /// <summary>
    /// Gets dashboard overview information
    /// </summary>
    Task<DashboardInfo> GetDashboardOverviewAsync();

    /// <summary>
    /// Gets resource metrics
    /// </summary>
    Task<ResourceUsageSummary> GetResourceMetricsAsync();

    /// <summary>
    /// Gets cluster health status
    /// </summary>
    Task<string> GetClusterHealthStatusAsync();
} 