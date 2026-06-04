using Microsoft.AspNetCore.Mvc;
using KubernetesControlPanel.Core.Configuration;
using KubernetesControlPanel.Services.Interfaces;

namespace KubernetesControlPanel.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LinksController : ControllerBase
{
    private readonly ILinksService _linksService;

    public LinksController(ILinksService linksService)
    {
        _linksService = linksService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ExternalLinksConfig), 200)]
    public ActionResult<ExternalLinksConfig> GetExternalLinks()
    {
        return Ok(_linksService.GetExternalLinks());
    }
}
