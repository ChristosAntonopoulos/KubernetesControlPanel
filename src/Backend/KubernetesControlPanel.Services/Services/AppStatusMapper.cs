using k8s.Models;

namespace KubernetesControlPanel.Services.Services;

public static class AppStatusMapper
{
    public static string MapDeploymentUserStatus(int replicas, int ready)
    {
        if (replicas == 0) return "Offline";
        if (ready >= replicas) return "Healthy";
        if (ready > 0) return "Degraded";
        return "Starting";
    }

    public static string MapDeploymentAdminStatus(int replicas, int ready)
    {
        if (replicas == 0) return "Scaled to zero";
        if (ready >= replicas) return "Healthy";
        if (ready > 0) return "Progressing";
        return "Unavailable";
    }

    public static string MapPodUserStatus(V1Pod pod)
    {
        var phase = pod.Status?.Phase ?? "Unknown";
        var containerStates = GetContainerStates(pod);

        if (containerStates.Any(s => s is "CrashLoopBackOff" or "ImagePullBackOff" or "ErrImagePull" or "Error"))
            return "Offline";

        if (phase == "Failed") return "Offline";
        if (phase == "Pending" || containerStates.Any(s => s is "Waiting" or "ContainerCreating"))
            return "Starting";

        if (pod.Status?.ContainerStatuses != null &&
            pod.Status.ContainerStatuses.Count > 0 &&
            pod.Status.ContainerStatuses.All(c => c.Ready))
            return "Healthy";

        if (pod.Status?.ContainerStatuses?.Any(c => c.Ready) == true)
            return "Degraded";

        return phase switch
        {
            "Running" => "Healthy",
            "Succeeded" => "Healthy",
            _ => "Unknown"
        };
    }

    public static string AggregateUserStatus(IEnumerable<string> componentStatuses)
    {
        var list = componentStatuses.ToList();
        if (list.Count == 0) return "Unknown";

        if (list.All(s => s == "Healthy")) return "Healthy";
        if (list.All(s => s is "Offline" or "Unknown")) return "Offline";
        if (list.Any(s => s == "Offline")) return "Degraded";
        if (list.Any(s => s == "Starting")) return "Starting";
        if (list.Any(s => s == "Degraded")) return "Degraded";
        return "Unknown";
    }

    public static string? BuildStatusReason(IEnumerable<V1Pod> pods, string? worstComponent)
    {
        foreach (var pod in pods)
        {
            foreach (var cs in pod.Status?.ContainerStatuses ?? new List<V1ContainerStatus>())
            {
                var waiting = cs.State?.Waiting;
                if (waiting != null && !string.IsNullOrEmpty(waiting.Reason))
                    return $"{waiting.Reason}: {waiting.Message}".TrimEnd(':', ' ');

                var terminated = cs.State?.Terminated;
                if (terminated?.Reason != null && terminated.ExitCode != 0)
                    return $"Container exited with code {terminated.ExitCode}";
            }
        }

        return worstComponent != null ? $"Component {worstComponent} is not fully ready." : null;
    }

    private static List<string> GetContainerStates(V1Pod pod)
    {
        var states = new List<string>();
        foreach (var cs in pod.Status?.ContainerStatuses ?? new List<V1ContainerStatus>())
        {
            if (cs.State?.Waiting?.Reason != null)
                states.Add(cs.State.Waiting.Reason);
            else if (cs.State?.Running != null)
                states.Add("Running");
            else if (cs.State?.Terminated != null)
                states.Add(cs.State.Terminated.Reason ?? "Terminated");
        }
        return states;
    }
}
