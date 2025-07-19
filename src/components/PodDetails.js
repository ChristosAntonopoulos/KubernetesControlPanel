import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  Trash2, 
  RotateCcw, 
  FileText, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  Cpu,
  HardDrive,
  Network,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PodDetails = () => {
  const { namespace, name } = useParams();
  const [pod, setPod] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchPodDetails();
    const interval = setInterval(fetchPodDetails, 15000);
    return () => clearInterval(interval);
  }, [namespace, name]);

  const fetchPodDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [podRes, metricsRes] = await Promise.all([
        fetch(`/api/pod/${namespace}/${name}`),
        fetch(`/api/pod/${namespace}/${name}/metrics`).catch(() => ({ json: () => ({ success: false }) }))
      ]);

      const [podData, metricsData] = await Promise.all([
        podRes.json(),
        metricsRes.json()
      ]);

      setPod(podData);
      setMetrics(metricsData.success ? metricsData : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePod = async () => {
    if (!window.confirm(`Are you sure you want to delete pod ${name}?`)) return;

    try {
      setActionLoading(prev => ({ ...prev, delete: true }));
      const response = await fetch(`/api/pod/${namespace}/${name}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`Pod deleted successfully: ${result.message}`);
        // Navigate back to pods list
        window.history.back();
      } else {
        alert(`Failed to delete pod: ${result.error}`);
      }
    } catch (err) {
      alert(`Failed to delete pod: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleRestartPod = async () => {
    if (!window.confirm(`Are you sure you want to restart pod ${name}?`)) return;

    try {
      setActionLoading(prev => ({ ...prev, restart: true }));
      const response = await fetch(`/api/pod/${namespace}/${name}/restart`, {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`Pod restart initiated: ${result.message}`);
        setTimeout(fetchPodDetails, 2000);
      } else {
        alert(`Failed to restart pod: ${result.error}`);
      }
    } catch (err) {
      alert(`Failed to restart pod: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, restart: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Running':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'Succeeded':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
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
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
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
            <h3 className="text-sm font-medium text-red-800">Error loading pod details</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!pod) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Pod not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/pods"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                {getStatusIcon(pod.status.phase)}
                <h1 className="text-3xl font-bold leading-6 text-gray-900">{pod.metadata.name}</h1>
                <span className={getStatusBadge(pod.status.phase)}>
                  {pod.status.phase}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Namespace: {pod.metadata.namespace} • Created {formatDistanceToNow(new Date(pod.metadata.creationTimestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchPodDetails}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <Link
              to={`/logs?namespace=${pod.metadata.namespace}&pod=${pod.metadata.name}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Logs
            </Link>
            <button
              onClick={handleRestartPod}
              disabled={actionLoading.restart}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            >
              {actionLoading.restart ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Restart
            </button>
            <button
              onClick={handleDeletePod}
              disabled={actionLoading.delete}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading.delete ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Cpu className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">CPU Usage</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics.cpu}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Memory Usage</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics.memory}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Restart Count</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pod.status.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pod Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Basic Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{pod.metadata.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Namespace</dt>
                <dd className="mt-1 text-sm text-gray-900">{pod.metadata.namespace}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Node</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Server className="h-4 w-4 mr-1 text-gray-400" />
                  {pod.spec.nodeName || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Pod IP</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Network className="h-4 w-4 mr-1 text-gray-400" />
                  {pod.status.podIP || 'Not assigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(pod.metadata.creationTimestamp).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Age</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDistanceToNow(new Date(pod.metadata.creationTimestamp), { addSuffix: true })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Labels and Annotations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Labels & Annotations</h3>
            
            {pod.metadata.labels && Object.keys(pod.metadata.labels).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Labels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(pod.metadata.labels).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pod.metadata.annotations && Object.keys(pod.metadata.annotations).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Annotations</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.entries(pod.metadata.annotations).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="ml-1 text-gray-500 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Containers */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Containers</h3>
          <div className="space-y-4">
            {pod.spec.containers.map((container, index) => {
              const containerStatus = pod.status.containerStatuses?.find(cs => cs.name === container.name);
              return (
                <div key={container.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{container.name}</h4>
                    {containerStatus && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        containerStatus.ready ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {containerStatus.ready ? 'Ready' : 'Not Ready'}
                      </span>
                    )}
                  </div>
                  
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Image</dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">{container.image}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Image Pull Policy</dt>
                      <dd className="mt-1 text-sm text-gray-900">{container.imagePullPolicy || 'Always'}</dd>
                    </div>
                    {containerStatus && (
                      <>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Restart Count</dt>
                          <dd className="mt-1 text-sm text-gray-900">{containerStatus.restartCount}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Container ID</dt>
                          <dd className="mt-1 text-sm text-gray-900 break-all font-mono">
                            {containerStatus.containerID?.replace('containerd://', '').substring(0, 12) || 'N/A'}
                          </dd>
                        </div>
                      </>
                    )}
                  </dl>

                  {container.ports && container.ports.length > 0 && (
                    <div className="mt-3">
                      <dt className="text-sm font-medium text-gray-500">Ports</dt>
                      <dd className="mt-1">
                        {container.ports.map((port, portIndex) => (
                          <span
                            key={portIndex}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2"
                          >
                            {port.containerPort}/{port.protocol || 'TCP'}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conditions */}
      {pod.status.conditions && pod.status.conditions.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Conditions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Transition
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pod.status.conditions.map((condition, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {condition.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          condition.status === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {condition.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {condition.reason || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {condition.lastTransitionTime ? 
                          formatDistanceToNow(new Date(condition.lastTransitionTime), { addSuffix: true }) : 
                          '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodDetails;