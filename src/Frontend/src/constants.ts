/**
 * Kubernetes system namespaces (internal cluster components).
 * Pods in these namespaces can be hidden via "Hide system pods" on the Pods page.
 */
export const SYSTEM_NAMESPACES = [
  'kube-system',
  'kube-public',
  'kube-node-lease',
];

export const PODS_HIDE_SYSTEM_STORAGE_KEY = 'pods-hide-system-pods';
