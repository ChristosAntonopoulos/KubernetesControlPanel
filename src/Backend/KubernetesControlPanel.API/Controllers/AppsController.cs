using Microsoft.AspNetCore.Mvc;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppsController : ControllerBase
{
    private readonly IAppDiscoveryService _appDiscoveryService;
    private readonly ILogger<AppsController> _logger;

    public AppsController(IAppDiscoveryService appDiscoveryService, ILogger<AppsController> logger)
    {
        _appDiscoveryService = appDiscoveryService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(AppListResponse), 200)]
    public async Task<ActionResult<AppListResponse>> GetApps()
    {
        try
        {
            return Ok(await _appDiscoveryService.GetAppsAsync());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting apps");
            return StatusCode(500, new { error = "Failed to retrieve apps" });
        }
    }

    [HttpGet("{namespaceName}/{appKey}")]
    [ProducesResponseType(typeof(DiscoveredApp), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<DiscoveredApp>> GetApp(string namespaceName, string appKey)
    {
        try
        {
            var app = await _appDiscoveryService.GetAppAsync(namespaceName, appKey);
            if (app == null) return NotFound(new { error = "App not found" });
            return Ok(app);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting app {AppKey}", appKey);
            return StatusCode(500, new { error = "Failed to retrieve app" });
        }
    }

    [HttpGet("{namespaceName}/{appKey}/admin")]
    [ProducesResponseType(typeof(AppAdminDetail), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<AppAdminDetail>> GetAppAdmin(string namespaceName, string appKey)
    {
        try
        {
            var detail = await _appDiscoveryService.GetAppAdminAsync(namespaceName, appKey);
            if (detail == null) return NotFound(new { error = "App not found" });
            return Ok(detail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin detail for {AppKey}", appKey);
            return StatusCode(500, new { error = "Failed to retrieve app admin detail" });
        }
    }
}
