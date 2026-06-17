using k8s;
using k8s.Models;
using KubernetesControlPanel.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace KubernetesControlPanel.API.Controllers;

[ApiController]
[Route("api/resources")]
public class ResourcesController : ControllerBase
{
    private readonly IKubernetes _kubernetesClient;
    private readonly ILogger<ResourcesController> _logger;

    public ResourcesController(IKubernetes kubernetesClient, ILogger<ResourcesController> logger)
    {
        _kubernetesClient = kubernetesClient;
        _logger = logger;
    }

    [HttpGet("{namespaceName}/{kind}/{name}/yaml")]
    [ProducesResponseType(typeof(ResourceYamlResult), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ResourceYamlResult>> GetYaml(string namespaceName, string kind, string name)
    {
        try
        {
            var normalizedKind = kind.ToLowerInvariant();
            object? resource = normalizedKind switch
            {
                "pod" => await _kubernetesClient.CoreV1.ReadNamespacedPodAsync(name, namespaceName),
                "deployment" => await _kubernetesClient.AppsV1.ReadNamespacedDeploymentAsync(name, namespaceName),
                "service" => await _kubernetesClient.CoreV1.ReadNamespacedServiceAsync(name, namespaceName),
                "ingress" => await _kubernetesClient.NetworkingV1.ReadNamespacedIngressAsync(name, namespaceName),
                "configmap" => await _kubernetesClient.CoreV1.ReadNamespacedConfigMapAsync(name, namespaceName),
                "secret" => RedactSecret(await _kubernetesClient.CoreV1.ReadNamespacedSecretAsync(name, namespaceName)),
                _ => null
            };

            if (resource == null)
                return NotFound(new { error = $"Unsupported or unknown resource kind: {kind}" });

            var yaml = KubernetesYaml.Serialize(resource);
            return Ok(new ResourceYamlResult
            {
                Kind = kind,
                Name = name,
                Namespace = namespaceName,
                Yaml = yaml
            });
        }
        catch (k8s.Autorest.HttpOperationException ex) when (ex.Response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return NotFound(new { error = "Resource not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading YAML for {Kind}/{Name}", kind, name);
            return StatusCode(500, new { error = "Failed to retrieve resource YAML" });
        }
    }

    private static V1Secret RedactSecret(V1Secret secret)
    {
        if (secret.Data != null)
        {
            secret.Data = secret.Data.ToDictionary(
                kv => kv.Key,
                kv => System.Text.Encoding.UTF8.GetBytes($"<redacted:{kv.Key}>"));
        }
        if (secret.StringData != null)
        {
            secret.StringData = secret.StringData.ToDictionary(
                kv => kv.Key,
                kv => $"<redacted:{kv.Key}>");
        }
        return secret;
    }
}
