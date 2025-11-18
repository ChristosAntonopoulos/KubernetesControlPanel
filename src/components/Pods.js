import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trash2, 
  RotateCcw, 
  Eye, 
  FileText, 
  Activity, 
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Pods = () => {
  const [pods, setPods] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchNamespaces();
    fetchPods();
    const interval = setInterval(fetchPods, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
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

  const fetchPods = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pods/${selectedNamespace}`);
      const data = await response.json();
      setPods(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePod = async (namespace, name) => {
    const actionKey = `${namespace}/${name}/delete`;
    if (!window.confirm(`Are you sure you want to delete pod ${name}?`)) return;

    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      const response = await fetch(`/api/pod/${namespace}/${name}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        // Remove pod from list immediately for better UX
        setPods(prev => prev.filter(p => !(p.name === name && p.namespace === namespace)));
        // Refresh pods after a short delay
        setTimeout(fetchPods, 2000);
      } else {
        alert(`Failed to delete pod: ${result.error}`);
      }
    } catch (err) {
      alert(`Failed to delete pod: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRestartPod = async (namespace, name) => {
    const actionKey = `${namespace}/${name}/restart`;
    if (!window.confirm(`Are you sure you want to restart pod ${name}?`)) return;

    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      const response = await fetch(`/api/pod/${namespace}/${name}/restart`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`Pod restart initiated: ${result.message}`);
        // Refresh pods after a short delay
        setTimeout(fetchPods, 2000);
      } else {
        alert(`Failed to restart pod: ${result.error}`);
      }
    } catch (err) {
      alert(`Failed to restart pod: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Running':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Succeeded':
        return <CheckCircle className="h-5 w-5 text-radiant-purple-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'Running':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Succeeded':
        return `${baseClasses} bg-radiant-purple-100 text-radiant-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredPods = pods.filter(pod => {
    const matchesSearch = pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pod.namespace.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pod.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && pods.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-radiant-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading pods</h3>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold leading-6 text-gray-900">Pods</h1>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              Manage and monitor your Kubernetes pods
            </p>
          </div>
          <button
            onClick={fetchPods}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-radiant-purple-600 hover:bg-radiant-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Namespace Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Namespace</label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500 sm:text-sm"
            >
              <option value="all">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns.name} value={ns.name}>{ns.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="Running">Running</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Succeeded">Succeeded</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search pods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredPods.length} of {pods.length} pods
      </div>

      {/* Pods Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Namespace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ready
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Restarts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Node
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPods.map((pod) => (
              <tr key={`${pod.namespace}/${pod.name}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(pod.status)}
                    <span className="ml-2 text-sm font-medium text-gray-900">{pod.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pod.namespace}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(pod.status)}>
                    {pod.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pod.ready}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pod.restarts}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(pod.age), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pod.node}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/pod/${pod.namespace}/${pod.name}`}
                      className="text-radiant-purple-600 hover:text-radiant-purple-900 p-1"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/logs?namespace=${pod.namespace}&pod=${pod.name}`}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="View Logs"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleRestartPod(pod.namespace, pod.name)}
                      disabled={actionLoading[`${pod.namespace}/${pod.name}/restart`]}
                      className="text-yellow-600 hover:text-yellow-900 p-1 disabled:opacity-50"
                      title="Restart Pod"
                    >
                      {actionLoading[`${pod.namespace}/${pod.name}/restart`] ? (
                        <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeletePod(pod.namespace, pod.name)}
                      disabled={actionLoading[`${pod.namespace}/${pod.name}/delete`]}
                      className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                      title="Delete Pod"
                    >
                      {actionLoading[`${pod.namespace}/${pod.name}/delete`] ? (
                        <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPods.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No pods found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pods;