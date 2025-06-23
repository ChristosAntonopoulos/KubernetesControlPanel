using Microsoft.AspNetCore.Mvc;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Controllers;

/// <summary>
/// Controller for pod operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class PodsController : ControllerBase
{
    private readonly IPodService _podService;
    private readonly ILogger<PodsController> _logger;

    public PodsController(
        IPodService podService,
        ILogger<PodsController> logger)
    {
        _podService = podService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all pods across all namespaces
    /// </summary>
    /// <returns>List of all pods</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<PodInfo>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<PodInfo>>> GetAllPods()
    {
        try
        {
            var pods = await _podService.GetAllPodsAsync();
            return Ok(pods);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all pods");
            return StatusCode(500, new { error = "Failed to retrieve pods" });
        }
    }

    /// <summary>
    /// Gets pods by namespace
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <returns>List of pods in the namespace</returns>
    [HttpGet("{namespaceName}")]
    [ProducesResponseType(typeof(List<PodInfo>), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<PodInfo>>> GetPodsByNamespace(string namespaceName)
    {
        try
        {
            var pods = await _podService.GetPodsByNamespaceAsync(namespaceName);
            return Ok(pods);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pods for namespace {Namespace}", namespaceName);
            return StatusCode(500, new { error = "Failed to retrieve pods for namespace" });
        }
    }

    /// <summary>
    /// Gets pod details
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <param name="podName">Pod name</param>
    /// <returns>Pod details</returns>
    [HttpGet("{namespaceName}/{podName}")]
    [ProducesResponseType(typeof(PodInfo), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<PodInfo>> GetPodDetails(string namespaceName, string podName)
    {
        try
        {
            var pod = await _podService.GetPodDetailsAsync(namespaceName, podName);
            if (pod == null)
            {
                return NotFound(new { error = "Pod not found" });
            }
            return Ok(pod);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pod details for {PodName} in namespace {Namespace}", podName, namespaceName);
            return StatusCode(500, new { error = "Failed to retrieve pod details" });
        }
    }

    /// <summary>
    /// Gets pod logs
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <param name="podName">Pod name</param>
    /// <param name="containerName">Container name (optional)</param>
    /// <param name="tailLines">Number of lines to retrieve (optional)</param>
    /// <returns>Pod logs</returns>
    [HttpGet("{namespaceName}/{podName}/logs")]
    [ProducesResponseType(typeof(string), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<string>> GetPodLogs(
        string namespaceName, 
        string podName, 
        [FromQuery] string? containerName = null,
        [FromQuery] int? tailLines = null)
    {
        try
        {
            var logs = await _podService.GetPodLogsAsync(namespaceName, podName, containerName, tailLines);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting logs for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return StatusCode(500, new { error = "Failed to retrieve pod logs" });
        }
    }

    /// <summary>
    /// Gets pod events
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <param name="podName">Pod name</param>
    /// <returns>Pod events</returns>
    [HttpGet("{namespaceName}/{podName}/events")]
    [ProducesResponseType(typeof(List<ClusterEvent>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<ClusterEvent>>> GetPodEvents(string namespaceName, string podName)
    {
        try
        {
            var events = await _podService.GetPodEventsAsync(namespaceName, podName);
            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events for pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return StatusCode(500, new { error = "Failed to retrieve pod events" });
        }
    }

    /// <summary>
    /// Restarts a pod
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <param name="podName">Pod name</param>
    /// <returns>Success status</returns>
    [HttpPost("{namespaceName}/{podName}/restart")]
    [ProducesResponseType(typeof(bool), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<bool>> RestartPod(string namespaceName, string podName)
    {
        try
        {
            var success = await _podService.RestartPodAsync(namespaceName, podName);
            return Ok(success);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restarting pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return StatusCode(500, new { error = "Failed to restart pod" });
        }
    }

    /// <summary>
    /// Deletes a pod
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <param name="podName">Pod name</param>
    /// <returns>Success status</returns>
    [HttpDelete("{namespaceName}/{podName}")]
    [ProducesResponseType(typeof(bool), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<bool>> DeletePod(string namespaceName, string podName)
    {
        try
        {
            var success = await _podService.DeletePodAsync(namespaceName, podName);
            return Ok(success);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting pod {PodName} in namespace {Namespace}", podName, namespaceName);
            return StatusCode(500, new { error = "Failed to delete pod" });
        }
    }
} 