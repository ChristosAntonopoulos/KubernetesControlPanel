using Microsoft.AspNetCore.Mvc;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Controllers;

/// <summary>
/// Controller for namespace operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class NamespacesController : ControllerBase
{
    private readonly INamespaceService _namespaceService;
    private readonly ILogger<NamespacesController> _logger;

    public NamespacesController(
        INamespaceService namespaceService,
        ILogger<NamespacesController> logger)
    {
        _namespaceService = namespaceService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all namespaces
    /// </summary>
    /// <returns>List of all namespaces</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<string>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<string>>> GetAllNamespaces()
    {
        try
        {
            var namespaces = await _namespaceService.GetAllNamespacesAsync();
            return Ok(namespaces);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all namespaces");
            return StatusCode(500, new { error = "Failed to retrieve namespaces" });
        }
    }

    /// <summary>
    /// Gets namespace details
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <returns>Namespace details</returns>
    [HttpGet("{namespaceName}")]
    [ProducesResponseType(typeof(NamespacePodCount), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<NamespacePodCount>> GetNamespaceDetails(string namespaceName)
    {
        try
        {
            var namespaceDetails = await _namespaceService.GetNamespaceDetailsAsync(namespaceName);
            if (namespaceDetails == null)
            {
                return NotFound(new { error = "Namespace not found" });
            }
            return Ok(namespaceDetails);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting namespace details for {Namespace}", namespaceName);
            return StatusCode(500, new { error = "Failed to retrieve namespace details" });
        }
    }

    /// <summary>
    /// Gets namespace events
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <returns>Namespace events</returns>
    [HttpGet("{namespaceName}/events")]
    [ProducesResponseType(typeof(List<ClusterEvent>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<ClusterEvent>>> GetNamespaceEvents(string namespaceName)
    {
        try
        {
            var events = await _namespaceService.GetNamespaceEventsAsync(namespaceName);
            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events for namespace {Namespace}", namespaceName);
            return StatusCode(500, new { error = "Failed to retrieve namespace events" });
        }
    }

    /// <summary>
    /// Gets namespace resource quotas
    /// </summary>
    /// <param name="namespaceName">Namespace name</param>
    /// <returns>Namespace resource quotas</returns>
    [HttpGet("{namespaceName}/quotas")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<object>> GetNamespaceResourceQuotas(string namespaceName)
    {
        try
        {
            var quotas = await _namespaceService.GetNamespaceResourceQuotasAsync(namespaceName);
            return Ok(quotas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resource quotas for namespace {Namespace}", namespaceName);
            return StatusCode(500, new { error = "Failed to retrieve namespace resource quotas" });
        }
    }
} 