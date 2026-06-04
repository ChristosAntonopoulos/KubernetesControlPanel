using Microsoft.AspNetCore.Mvc;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccessController : ControllerBase
{
    private readonly IAccessService _accessService;
    private readonly ILogger<AccessController> _logger;

    public AccessController(IAccessService accessService, ILogger<AccessController> logger)
    {
        _accessService = accessService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ClusterAccessOverview), 200)]
    public async Task<ActionResult<ClusterAccessOverview>> GetClusterAccess()
    {
        try
        {
            return Ok(await _accessService.GetClusterAccessAsync());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cluster access overview");
            return StatusCode(500, new { message = "Failed to discover applications from the cluster." });
        }
    }
}
