using Microsoft.AspNetCore.SignalR;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Hubs;

/// <summary>
/// SignalR hub for real-time cluster updates
/// </summary>
public class ClusterHub : Hub
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<ClusterHub> _logger;

    public ClusterHub(
        IDashboardService dashboardService,
        ILogger<ClusterHub> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Gets current cluster overview
    /// </summary>
    public async Task<DashboardInfo> GetClusterOverview()
    {
        try
        {
            return await _dashboardService.GetDashboardOverviewAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cluster overview in hub");
            throw;
        }
    }

    /// <summary>
    /// Gets cluster health status
    /// </summary>
    public async Task<string> GetClusterHealth()
    {
        try
        {
            return await _dashboardService.GetClusterHealthStatusAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cluster health in hub");
            return "Unknown";
        }
    }

    /// <summary>
    /// Client connected event
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Client disconnected event
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
} 