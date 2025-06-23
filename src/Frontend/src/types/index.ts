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
  requests?: ResourceRequirements;
  limits?: ResourceRequirements;
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
} 