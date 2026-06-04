using Microsoft.AspNetCore.Mvc;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeploymentsController : ControllerBase
{
    private readonly IDeploymentService _deploymentService;
    private readonly ILogger<DeploymentsController> _logger;

    public DeploymentsController(IDeploymentService deploymentService, ILogger<DeploymentsController> logger)
    {
        _deploymentService = deploymentService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<DeploymentInfo>), 200)]
    public async Task<ActionResult<List<DeploymentInfo>>> GetAllDeployments()
    {
        try
        {
            return Ok(await _deploymentService.GetAllDeploymentsAsync());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deployments");
            return StatusCode(500, new { error = "Failed to retrieve deployments" });
        }
    }

    [HttpGet("{namespaceName}")]
    [ProducesResponseType(typeof(List<DeploymentInfo>), 200)]
    public async Task<ActionResult<List<DeploymentInfo>>> GetDeploymentsByNamespace(string namespaceName)
    {
        try
        {
            return Ok(await _deploymentService.GetDeploymentsByNamespaceAsync(namespaceName));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deployments for namespace {Namespace}", namespaceName);
            return StatusCode(500, new { error = "Failed to retrieve deployments" });
        }
    }

    [HttpGet("{namespaceName}/{deploymentName}")]
    [ProducesResponseType(typeof(DeploymentInfo), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<DeploymentInfo>> GetDeployment(string namespaceName, string deploymentName)
    {
        try
        {
            var deployment = await _deploymentService.GetDeploymentAsync(namespaceName, deploymentName);
            if (deployment == null)
            {
                return NotFound(new { error = "Deployment not found" });
            }
            return Ok(deployment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deployment {Name}", deploymentName);
            return StatusCode(500, new { error = "Failed to retrieve deployment" });
        }
    }

    [HttpPut("{namespaceName}/{deploymentName}/scale")]
    [ProducesResponseType(typeof(ScaleDeploymentResult), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<ScaleDeploymentResult>> ScaleDeployment(
        string namespaceName,
        string deploymentName,
        [FromBody] ScaleDeploymentRequest request)
    {
        try
        {
            var result = await _deploymentService.ScaleDeploymentAsync(
                namespaceName, deploymentName, request.Replicas);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scaling deployment {Name}", deploymentName);
            return StatusCode(500, new { error = "Failed to scale deployment" });
        }
    }
}
