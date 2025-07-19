import React, { useState, useEffect } from 'react';
import { Server, Database, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    pods: [],
    namespaces: [],
    nodes: [],
    events: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [podsRes, namespacesRes, nodesRes, eventsRes] = await Promise.all([
        fetch('/api/pods/all'),
        fetch('/api/namespaces'),
        fetch('/api/nodes/metrics'),
        fetch('/api/events/all')
      ]);

      const [pods, namespaces, nodes, events] = await Promise.all([
        podsRes.json(),
        namespacesRes.json(),
        nodesRes.json(),
        eventsRes.json()
      ]);

      setDashboardData({ pods, namespaces, nodes, events });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { Running: 0, Pending: 0, Failed: 0, Succeeded: 0, Unknown: 0 };
    dashboardData.pods.forEach(pod => {
      counts[pod.status] = (counts[pod.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  };

  const getNamespaceStats = () => {
    const namespaceMap = {};
    dashboardData.pods.forEach(pod => {
      namespaceMap[pod.namespace] = (namespaceMap[pod.namespace] || 0) + 1;
    });
    return Object.entries(namespaceMap)
      .map(([namespace, count]) => ({ namespace, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getRecentEvents = () => {
    return dashboardData.events
      .filter(event => event.type === 'Warning' || event.type === 'Normal')
      .slice(0, 10);
  };

  const pieColors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#6B7280'];
  const statusCounts = getStatusCounts();
  const namespaceStats = getNamespaceStats();
  const recentEvents = getRecentEvents();

  if (loading && dashboardData.pods.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Dashboard</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Overview of your Kubernetes cluster
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Pods</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardData.pods.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Server className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Namespaces</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardData.namespaces.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Running Pods</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.pods.filter(p => p.status === 'Running').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Nodes</dt>
                  <dd className="text-lg font-medium text-gray-900">{dashboardData.nodes.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pod Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pod Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusCounts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Namespace Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pods by Namespace</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={namespaceStats.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="namespace" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Events</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentEvents.map((event, idx) => (
                <li key={idx}>
                  <div className="relative pb-8">
                    {idx !== recentEvents.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        {event.type === 'Warning' ? (
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{event.object}</span> - {event.reason}
                          </p>
                          <p className="text-sm text-gray-500">{event.message}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <Clock className="inline h-4 w-4 mr-1" />
                          {new Date(event.time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;