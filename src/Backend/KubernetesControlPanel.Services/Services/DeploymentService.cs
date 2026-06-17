using k8s;
using k8s.Models;
using KubernetesControlPanel.Core.Models;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace KubernetesControlPanel.Services.Services;

public class DeploymentService : IDeploymentService
{
    private readonly IKubernetes _kubernetesClient;
    private readonly ILogger<DeploymentService> _logger;

    public DeploymentService(IKubernetes kubernetesClient, ILogger<DeploymentService> logger)
    {
        _kubernetesClient = kubernetesClient;
        _logger = logger;
    }

    public async Task<List<DeploymentInfo>> GetAllDeploymentsAsync()
    {
        try
        {
            var list = await _kubernetesClient.AppsV1.ListDeploymentForAllNamespacesAsync();
            return list.Items.Select(MapDeployment).OrderBy(d => d.Namespace).ThenBy(d => d.Name).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing deployments");
            throw;
        }
    }

    public async Task<List<DeploymentInfo>> GetDeploymentsByNamespaceAsync(string namespaceName)
    {
        try
        {
            var list = await _kubernetesClient.AppsV1.ListNamespacedDeploymentAsync(namespaceName);
            return list.Items.Select(MapDeployment).OrderBy(d => d.Name).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing deployments in namespace {Namespace}", namespaceName);
            throw;
        }
    }

    public async Task<DeploymentInfo?> GetDeploymentAsync(string namespaceName, string deploymentName)
    {
        try
        {
            var deployment = await _kubernetesClient.AppsV1.ReadNamespacedDeploymentAsync(deploymentName, namespaceName);
            return MapDeployment(deployment);
        }
        catch (k8s.Autorest.HttpOperationException ex) when (ex.Response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading deployment {Name} in {Namespace}", deploymentName, namespaceName);
            throw;
        }
    }

    public async Task<ScaleDeploymentResult> ScaleDeploymentAsync(string namespaceName, string deploymentName, int replicas)
    {
        var result = new ScaleDeploymentResult
        {
            Name = deploymentName,
            Namespace = namespaceName,
            NewReplicas = replicas
        };

        if (replicas < 0)
        {
            result.Success = false;
            result.ErrorMessage = "Replica count cannot be negative.";
            return result;
        }

        try
        {
            var deployment = await _kubernetesClient.AppsV1.ReadNamespacedDeploymentAsync(deploymentName, namespaceName);
            result.PreviousReplicas = deployment.Spec?.Replicas ?? 0;
            deployment.Spec ??= new V1DeploymentSpec();
            deployment.Spec.Replicas = replicas;

            await _kubernetesClient.AppsV1.ReplaceNamespacedDeploymentAsync(deployment, deploymentName, namespaceName);
            result.Success = true;
            _logger.LogInformation(
                "Scaled deployment {Name} in {Namespace} from {Old} to {New} replicas",
                deploymentName, namespaceName, result.PreviousReplicas, replicas);
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = ex.Message;
            _logger.LogError(ex, "Error scaling deployment {Name} in {Namespace}", deploymentName, namespaceName);
        }

        return result;
    }

    public async Task<RestartDeploymentResult> RestartDeploymentAsync(string namespaceName, string deploymentName)
    {
        var result = new RestartDeploymentResult
        {
            Name = deploymentName,
            Namespace = namespaceName
        };

        try
        {
            var deployment = await _kubernetesClient.AppsV1.ReadNamespacedDeploymentAsync(deploymentName, namespaceName);
            deployment.Spec ??= new V1DeploymentSpec();
            deployment.Spec.Template ??= new V1PodTemplateSpec();
            deployment.Spec.Template.Metadata ??= new V1ObjectMeta();
            deployment.Spec.Template.Metadata.Annotations ??= new Dictionary<string, string>();
            deployment.Spec.Template.Metadata.Annotations["kubectl.kubernetes.io/restartedAt"] =
                DateTime.UtcNow.ToString("O");

            await _kubernetesClient.AppsV1.ReplaceNamespacedDeploymentAsync(deployment, deploymentName, namespaceName);
            result.Success = true;
            _logger.LogInformation("Restarted deployment {Name} in {Namespace}", deploymentName, namespaceName);
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = ex.Message;
            _logger.LogError(ex, "Error restarting deployment {Name} in {Namespace}", deploymentName, namespaceName);
        }

        return result;
    }

    private static DeploymentInfo MapDeployment(V1Deployment deployment)
    {
        var status = deployment.Status;
        var replicas = deployment.Spec?.Replicas ?? 0;
        var ready = status?.ReadyReplicas ?? 0;
        var available = status?.AvailableReplicas ?? 0;

        string deploymentStatus;
        if (replicas == 0)
        {
            deploymentStatus = "Scaled to zero";
        }
        else if (ready >= replicas)
        {
            deploymentStatus = "Healthy";
        }
        else if (ready > 0)
        {
            deploymentStatus = "Progressing";
        }
        else
        {
            deploymentStatus = "Unavailable";
        }

        return new DeploymentInfo
        {
            Name = deployment.Metadata?.Name ?? string.Empty,
            Namespace = deployment.Metadata?.NamespaceProperty ?? string.Empty,
            Replicas = replicas,
            ReadyReplicas = ready,
            AvailableReplicas = available,
            UpdatedReplicas = status?.UpdatedReplicas ?? 0,
            CreationTimestamp = deployment.Metadata?.CreationTimestamp ?? DateTime.UtcNow,
            Labels = deployment.Metadata?.Labels?.ToDictionary(k => k.Key, v => v.Value) ?? new Dictionary<string, string>(),
            Status = deploymentStatus
        };
    }
}
