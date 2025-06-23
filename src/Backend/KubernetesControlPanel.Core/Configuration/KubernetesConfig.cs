namespace KubernetesControlPanel.Core.Configuration;

/// <summary>
/// Configuration settings for Kubernetes cluster connection
/// </summary>
public class KubernetesConfig
{
    /// <summary>
    /// Kubernetes API server URL
    /// </summary>
    public string ApiServerUrl { get; set; } = string.Empty;

    /// <summary>
    /// Path to the service account token
    /// </summary>
    public string TokenPath { get; set; } = "/var/run/secrets/kubernetes.io/serviceaccount/token";

    /// <summary>
    /// Path to the CA certificate
    /// </summary>
    public string CertificatePath { get; set; } = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";

    /// <summary>
    /// Default namespace to use
    /// </summary>
    public string Namespace { get; set; } = "default";

    /// <summary>
    /// Cache timeout for cluster data
    /// </summary>
    public TimeSpan CacheTimeout { get; set; } = TimeSpan.FromMinutes(1);
} 