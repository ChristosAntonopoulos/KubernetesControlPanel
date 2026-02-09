export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  phase: string;
  podIP?: string;
  nodeName?: string;
  creationTimestamp: string;
  containers: ContainerInfo[];
  labels: Record<string, string>;
  annotations: Record<string, string>;
  restartCount: number;
  isReady: boolean;
  ready: boolean; // Ready status for display
  requests?: ResourceRequirements;
  limits?: ResourceRequirements;
  /** NodePorts from Services that select this pod (for external access via node IP). */
  nodePorts?: number[];
}

export interface ContainerInfo {
  name: string;
  image: string;
  status: string;
  ready: boolean;
  restartCount: number;
  state: string;
}

export interface ResourceRequirements {
  cpu?: string;
  memory?: string;
}

export interface NodeInfo {
  name: string;
  status: string;
  role: string;
  internalIP?: string;
  externalIP?: string;
  creationTimestamp: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  capacity?: NodeResources;
  allocatable?: NodeResources;
  conditions: NodeCondition[];
  kubernetesVersion?: string;
  operatingSystem?: string;
  architecture?: string;
  containerRuntime?: string;
  /** Current CPU usage in millicores (from metrics-server when available). */
  cpuUsageMillicores?: number | null;
  /** Current memory usage in bytes (from metrics-server when available). */
  memoryUsageBytes?: number | null;
}

export interface NodeResources {
  cpu?: string;
  memory?: string;
  pods?: string;
  ephemeralStorage?: string;
}

export interface NodeCondition {
  type: string;
  status: string;
  lastHeartbeatTime?: string;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface DashboardInfo {
  clusterName: string;
  kubernetesVersion: string;
  healthStatus: string;
  totalNodes: number;
  readyNodes: number;
  totalPods: number;
  runningPods: number;
  pendingPods: number;
  failedPods: number;
  totalNamespaces: number;
  podStatusBreakdown: Record<string, number>;
  nodeStatusBreakdown: Record<string, number>;
  namespacePodDistribution: NamespacePodCount[];
  recentEvents: ClusterEvent[];
  resourceUsage: ResourceUsageSummary;
  lastUpdated: string;
}

export interface NamespacePodCount {
  namespace: string;
  podCount: number;
  runningPods: number;
  failedPods: number;
}

export interface ClusterEvent {
  type: string;
  reason: string;
  message: string;
  timestamp: string;
  involvedObjectKind: string;
  involvedObjectName: string;
  namespace: string;
}

export interface ResourceUsageSummary {
  cpuUsagePercentage: number;
  memoryUsagePercentage: number;
  totalCpu: string;
  totalMemory: string;
  usedCpu: string;
  usedMemory: string;
  /** False when metrics-server is not available; then used/percentages are 0. */
  metricsAvailable?: boolean;
}

// New interfaces for enhanced pod management

export interface PodMetrics {
  name: string;
  namespace: string;
  containers: ContainerMetrics[];
  timestamp: string;
  totalCpuUsage: number;
  totalMemoryUsage: number;
}

export interface ContainerMetrics {
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  cpuRequests?: number;
  memoryRequests?: number;
  cpuLimits?: number;
  memoryLimits?: number;
}

export interface PodRestartResult {
  success: boolean;
  podName: string;
  namespace: string;
  restartTimestamp: string;
  message?: string;
  previousPodUid?: string;
  newPodUid?: string;
}

export interface PodResourceUsage {
  timestamp: string;
  podName: string;
  namespace: string;
  cpuUsage: number;
  memoryUsage: number;
  networkRxBytes?: number;
  networkTxBytes?: number;
  filesystemUsage?: number;
  cpuUsagePercentage?: number;
  memoryUsagePercentage?: number;
}

// Enhanced pod actions
export interface PodAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  disabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface LogViewerOptions {
  namespace: string;
  podName: string;
  containerName?: string;
  tailLines?: number;
  previous?: boolean;
  follow?: boolean;
} 