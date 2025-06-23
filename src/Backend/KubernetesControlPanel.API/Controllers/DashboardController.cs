using Microsoft.AspNetCore.Mvc;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Controllers;

/// <summary>
/// Controller for dashboard operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(
        IDashboardService dashboardService,
        ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Gets dashboard overview information
    /// </summary>
    /// <returns>Dashboard overview information</returns>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(DashboardInfo), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<DashboardInfo>> GetOverview()
    {
        try
        {
            var overview = await _dashboardService.GetDashboardOverviewAsync();
            return Ok(overview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard overview");
            return StatusCode(500, new { error = "Failed to retrieve dashboard overview" });
        }
    }

    /// <summary>
    /// Gets resource metrics
    /// </summary>
    /// <returns>Resource usage summary</returns>
    [HttpGet("metrics")]
    [ProducesResponseType(typeof(ResourceUsageSummary), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<ResourceUsageSummary>> GetMetrics()
    {
        try
        {
            var metrics = await _dashboardService.GetResourceMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resource metrics");
            return StatusCode(500, new { error = "Failed to retrieve resource metrics" });
        }
    }

    /// <summary>
    /// Gets cluster health status
    /// </summary>
    /// <returns>Cluster health status</returns>
    [HttpGet("health")]
    [ProducesResponseType(typeof(string), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<string>> GetHealth()
    {
        try
        {
            var health = await _dashboardService.GetClusterHealthStatusAsync();
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cluster health status");
            return StatusCode(500, new { error = "Failed to retrieve cluster health status" });
        }
    }
} 