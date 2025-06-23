import axios from 'axios';
import { DashboardInfo, PodInfo, NodeInfo, ClusterEvent, ResourceUsageSummary, NamespacePodCount } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Dashboard API
export const dashboardApi = {
  getOverview: async (): Promise<DashboardInfo> => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },
  getMetrics: async (): Promise<ResourceUsageSummary> => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },
  getHealth: async (): Promise<string> => {
    const response = await api.get('/dashboard/health');
    return response.data;
  },
};

// Pods API
export const podsApi = {
  getAll: async (): Promise<PodInfo[]> => {
    const response = await api.get('/pods');
    return response.data;
  },
  getByNamespace: async (namespace: string): Promise<PodInfo[]> => {
    const response = await api.get(`/pods/${namespace}`);
    return response.data;
  },
  getDetails: async (namespace: string, podName: string): Promise<PodInfo> => {
    const response = await api.get(`/pods/${namespace}/${podName}`);
    return response.data;
  },
  getLogs: async (namespace: string, podName: string, containerName?: string, tailLines?: number): Promise<string> => {
    const params = new URLSearchParams();
    if (containerName) params.append('containerName', containerName);
    if (tailLines) params.append('tailLines', tailLines.toString());
    
    const response = await api.get(`/pods/${namespace}/${podName}/logs?${params.toString()}`);
    return response.data;
  },
  getEvents: async (namespace: string, podName: string): Promise<ClusterEvent[]> => {
    const response = await api.get(`/pods/${namespace}/${podName}/events`);
    return response.data;
  },
  restart: async (namespace: string, podName: string): Promise<boolean> => {
    const response = await api.post(`/pods/${namespace}/${podName}/restart`);
    return response.data;
  },
  delete: async (namespace: string, podName: string): Promise<boolean> => {
    const response = await api.delete(`/pods/${namespace}/${podName}`);
    return response.data;
  },
};

// Nodes API
export const nodesApi = {
  getAll: async (): Promise<NodeInfo[]> => {
    const response = await api.get('/nodes');
    return response.data;
  },
  getDetails: async (nodeName: string): Promise<NodeInfo> => {
    const response = await api.get(`/nodes/${nodeName}`);
    return response.data;
  },
  getEvents: async (nodeName: string): Promise<ClusterEvent[]> => {
    const response = await api.get(`/nodes/${nodeName}/events`);
    return response.data;
  },
  getPods: async (nodeName: string): Promise<PodInfo[]> => {
    const response = await api.get(`/nodes/${nodeName}/pods`);
    return response.data;
  },
};

// Namespaces API
export const namespacesApi = {
  getAll: async (): Promise<string[]> => {
    const response = await api.get('/namespaces');
    return response.data;
  },
  getDetails: async (namespaceName: string): Promise<NamespacePodCount> => {
    const response = await api.get(`/namespaces/${namespaceName}`);
    return response.data;
  },
  getEvents: async (namespaceName: string): Promise<ClusterEvent[]> => {
    const response = await api.get(`/namespaces/${namespaceName}/events`);
    return response.data;
  },
  getResourceQuotas: async (namespaceName: string): Promise<any> => {
    const response = await api.get(`/namespaces/${namespaceName}/quotas`);
    return response.data;
  },
};

export default api; 