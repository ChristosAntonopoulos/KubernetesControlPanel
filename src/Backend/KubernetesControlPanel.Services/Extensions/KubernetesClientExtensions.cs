using k8s;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace KubernetesControlPanel.Services.Extensions;

/// <summary>
/// Extension methods for configuring Kubernetes client
/// </summary>
public static class KubernetesClientExtensions
{
    /// <summary>
    /// Adds Kubernetes client to the service collection
    /// </summary>
    public static IServiceCollection AddKubernetesClient(this IServiceCollection services)
    {
        services.AddSingleton<IKubernetes>(provider =>
        {
            var logger = provider.GetRequiredService<ILogger<IKubernetes>>();
            
            try
            {
                // Try to load in-cluster config first (when running inside Kubernetes)
                var config = KubernetesClientConfiguration.InClusterConfig();
                logger.LogInformation("Using in-cluster Kubernetes configuration");
                return new Kubernetes(config);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to load in-cluster config, trying to load from kubeconfig file");
                
                try
                {
                    // Fallback to kubeconfig file (for local development)
                    var config = KubernetesClientConfiguration.BuildConfigFromConfigFile();
                    logger.LogInformation("Using kubeconfig file configuration");
                    return new Kubernetes(config);
                }
                catch (Exception kubeconfigEx)
                {
                    logger.LogError(kubeconfigEx, "Failed to load kubeconfig file");
                    throw new InvalidOperationException("Unable to configure Kubernetes client. Please ensure you have proper cluster access.", kubeconfigEx);
                }
            }
        });

        return services;
    }
} 