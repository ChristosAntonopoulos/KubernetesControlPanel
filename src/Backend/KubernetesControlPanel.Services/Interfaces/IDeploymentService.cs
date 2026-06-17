using KubernetesControlPanel.Core.Models;

namespace KubernetesControlPanel.Services.Interfaces;

public interface IDeploymentService
{
    Task<List<DeploymentInfo>> GetAllDeploymentsAsync();
    Task<List<DeploymentInfo>> GetDeploymentsByNamespaceAsync(string namespaceName);
    Task<DeploymentInfo?> GetDeploymentAsync(string namespaceName, string deploymentName);
    Task<ScaleDeploymentResult> ScaleDeploymentAsync(string namespaceName, string deploymentName, int replicas);
    Task<RestartDeploymentResult> RestartDeploymentAsync(string namespaceName, string deploymentName);
}
