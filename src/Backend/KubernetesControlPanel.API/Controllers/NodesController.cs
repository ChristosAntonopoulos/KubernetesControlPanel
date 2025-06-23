using Microsoft.AspNetCore.Mvc;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Controllers;

/// <summary>
/// Controller for node operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class NodesController : ControllerBase
{
    private readonly INodeService _nodeService;
    private readonly ILogger<NodesController> _logger;

    public NodesController(
        INodeService nodeService,
        ILogger<NodesController> logger)
    {
        _nodeService = nodeService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all nodes
    /// </summary>
    /// <returns>List of all nodes</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<NodeInfo>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<NodeInfo>>> GetAllNodes()
    {
        try
        {
            var nodes = await _nodeService.GetAllNodesAsync();
            return Ok(nodes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all nodes");
            return StatusCode(500, new { error = "Failed to retrieve nodes" });
        }
    }

    /// <summary>
    /// Gets node details
    /// </summary>
    /// <param name="nodeName">Node name</param>
    /// <returns>Node details</returns>
    [HttpGet("{nodeName}")]
    [ProducesResponseType(typeof(NodeInfo), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<NodeInfo>> GetNodeDetails(string nodeName)
    {
        try
        {
            var node = await _nodeService.GetNodeDetailsAsync(nodeName);
            if (node == null)
            {
                return NotFound(new { error = "Node not found" });
            }
            return Ok(node);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting node details for {NodeName}", nodeName);
            return StatusCode(500, new { error = "Failed to retrieve node details" });
        }
    }

    /// <summary>
    /// Gets node events
    /// </summary>
    /// <param name="nodeName">Node name</param>
    /// <returns>Node events</returns>
    [HttpGet("{nodeName}/events")]
    [ProducesResponseType(typeof(List<ClusterEvent>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<ClusterEvent>>> GetNodeEvents(string nodeName)
    {
        try
        {
            var events = await _nodeService.GetNodeEventsAsync(nodeName);
            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events for node {NodeName}", nodeName);
            return StatusCode(500, new { error = "Failed to retrieve node events" });
        }
    }

    /// <summary>
    /// Gets pods running on a node
    /// </summary>
    /// <param name="nodeName">Node name</param>
    /// <returns>List of pods on the node</returns>
    [HttpGet("{nodeName}/pods")]
    [ProducesResponseType(typeof(List<PodInfo>), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<List<PodInfo>>> GetPodsOnNode(string nodeName)
    {
        try
        {
            var pods = await _nodeService.GetPodsOnNodeAsync(nodeName);
            return Ok(pods);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pods on node {NodeName}", nodeName);
            return StatusCode(500, new { error = "Failed to retrieve pods on node" });
        }
    }
} 