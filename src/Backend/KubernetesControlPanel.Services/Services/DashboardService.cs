using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace KubernetesControlPanel.Services.Services;

/// <summary>
/// Service for dashboard operations
/// </summary>
public class DashboardService : IDashboardService
{
    private readonly IKubernetesService _kubernetesService;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(
        IKubernetesService kubernetesService,
        ILogger<DashboardService> logger)
    {
        _kubernetesService = kubernetesService;
        _logger = logger;
    }

    public async Task<DashboardInfo> GetDashboardOverviewAsync()
    {
        try
        {
            return await _kubernetesService.GetClusterInfoAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard overview");
            throw;
        }
    }

    public async Task<ResourceUsageSummary> GetResourceMetricsAsync()
    {
        try
        {
            var clusterInfo = await _kubernetesService.GetClusterInfoAsync();
            return clusterInfo.ResourceUsage;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resource metrics");
            throw;
        }
    }

    public async Task<string> GetClusterHealthStatusAsync()
    {
        try
        {
            var clusterInfo = await _kubernetesService.GetClusterInfoAsync();
            return clusterInfo.HealthStatus;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cluster health status");
            return "Unknown";
        }
    }
} 