import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Server,
  Database
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Metrics = () => {
  const [pods, setPods] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);

  useEffect(() => {
    fetchNamespaces();
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [selectedNamespace]);

  const fetchNamespaces = async () => {
    try {
      const response = await fetch('/api/namespaces');
      const data = await response.json();
      setNamespaces(data);
    } catch (err) {
      console.error('Failed to fetch namespaces:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [podsRes, nodesRes] = await Promise.all([
        fetch(`/api/pods/${selectedNamespace}`),
        fetch('/api/nodes/metrics')
      ]);

      const [podsData, nodesData] = await Promise.all([
        podsRes.json(),
        nodesRes.json()
      ]);

      // Fetch individual pod metrics
      const podMetricsPromises = podsData.map(async (pod) => {
        try {
          const response = await fetch(`/api/pod/${pod.namespace}/${pod.name}/metrics`);
          const metrics = await response.json();
          return {
            ...pod,
            metrics: metrics.success ? metrics : null
          };
        } catch (err) {
          return {
            ...pod,
            metrics: null
          };
        }
      });

      const podsWithMetrics = await Promise.all(podMetricsPromises);
      
      setPods(podsWithMetrics);
      setNodes(nodesData);

      // Store metrics history for charts
      const timestamp = new Date().toLocaleTimeString();
      setMetricsHistory(prev => {
        const newHistory = [...prev, {
          timestamp,
          totalPods: podsWithMetrics.length,
          runningPods: podsWithMetrics.filter(p => p.status === 'Running').length,
          totalNodes: nodesData.length
        }];
        // Keep only last 20 data points
        return newHistory.slice(-20);
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getResourceUsage = () => {
    const podsWithMetrics = pods.filter(p => p.metrics);
    
    if (podsWithMetrics.length === 0) {
      return { totalCpu: 'N/A', totalMemory: 'N/A', avgCpu: 'N/A', avgMemory: 'N/A' };
    }

    const totalCpu = podsWithMetrics.reduce((sum, pod) => {
      const cpu = parseFloat(pod.metrics.cpu?.replace(/[^0-9.]/g, '') || 0);
      return sum + cpu;
    }, 0);

    const totalMemory = podsWithMetrics.reduce((sum, pod) => {
      const memory = parseFloat(pod.metrics.memory?.replace(/[^0-9.]/g, '') || 0);
      return sum + memory;
    }, 0);

    return {
      totalCpu: totalCpu.toFixed(0) + 'm',
      totalMemory: totalMemory.toFixed(0) + 'Mi',
      avgCpu: (totalCpu / podsWithMetrics.length).toFixed(0) + 'm',
      avgMemory: (totalMemory / podsWithMetrics.length).toFixed(0) + 'Mi'
    };
  };

  const getTopResourceConsumers = () => {
    return pods
      .filter(p => p.metrics)
      .sort((a, b) => {
        const aCpu = parseFloat(a.metrics.cpu?.replace(/[^0-9.]/g, '') || 0);
        const bCpu = parseFloat(b.metrics.cpu?.replace(/[^0-9.]/g, '') || 0);
        return bCpu - aCpu;
      })
      .slice(0, 10);
  };

  const resourceUsage = getResourceUsage();
  const topConsumers = getTopResourceConsumers();

  if (loading && pods.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-radiant-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold leading-6 text-gray-900">Metrics</h1>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              Monitor resource usage and performance metrics
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-radiant-purple-600 hover:bg-radiant-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Namespace Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">Namespace</label>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500"
          >
            <option value="all">All Namespaces</option>
            {namespaces.map(ns => (
              <option key={ns.name} value={ns.name}>{ns.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading metrics</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Usage Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Cpu className="h-6 w-6 text-radiant-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total CPU</dt>
                  <dd className="text-lg font-medium text-gray-900">{resourceUsage.totalCpu}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HardDrive className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Memory</dt>
                  <dd className="text-lg font-medium text-gray-900">{resourceUsage.totalMemory}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg CPU/Pod</dt>
                  <dd className="text-lg font-medium text-gray-900">{resourceUsage.avgCpu}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Memory/Pod</dt>
                  <dd className="text-lg font-medium text-gray-900">{resourceUsage.avgMemory}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pod Count History */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pod Count Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalPods" stroke="#3B82F6" name="Total Pods" />
              <Line type="monotone" dataKey="runningPods" stroke="#10B981" name="Running Pods" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Resource Consumers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top CPU Consumers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topConsumers.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey={(pod) => parseFloat(pod.metrics?.cpu?.replace(/[^0-9.]/g, '') || 0)} 
                fill="#F59E0B" 
                name="CPU (m)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Node Metrics */}
      {nodes.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Node Metrics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Node
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPU Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPU %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Memory Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Memory %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nodes.map((node) => (
                    <tr key={node.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Server className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{node.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {node.cpu}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-radiant-purple-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, parseFloat(node.cpuPercent) || 0)}%` }}
                            ></div>
                          </div>
                          {node.cpuPercent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {node.memory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, parseFloat(node.memoryPercent) || 0)}%` }}
                            ></div>
                          </div>
                          {node.memoryPercent}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pod Metrics Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Pod Metrics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pod
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Namespace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Memory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pods.map((pod) => (
                  <tr key={`${pod.namespace}/${pod.name}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Database className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{pod.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pod.namespace}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pod.metrics ? pod.metrics.cpu : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pod.metrics ? pod.metrics.memory : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pod.status === 'Running' ? 'bg-green-100 text-green-800' :
                        pod.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pod.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {pods.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No pods found in the selected namespace.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Metrics;