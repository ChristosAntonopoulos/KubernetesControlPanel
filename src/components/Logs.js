import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Search,
  AlertCircle,
  FileText,
  Terminal,
  Clock
} from 'lucide-react';

const Logs = () => {
  const [searchParams] = useSearchParams();
  const [pods, setPods] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState(
    searchParams.get('namespace') || 'default'
  );
  const [selectedPod, setSelectedPod] = useState(
    searchParams.get('pod') || ''
  );
  const [selectedContainer, setSelectedContainer] = useState('');
  const [logs, setLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lineCount, setLineCount] = useState(100);
  
  const wsRef = useRef(null);
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);

  useEffect(() => {
    fetchNamespaces();
    if (selectedNamespace !== 'default') {
      fetchPods();
    }
  }, []);

  useEffect(() => {
    fetchPods();
  }, [selectedNamespace]);

  useEffect(() => {
    if (selectedPod) {
      const pod = pods.find(p => p.name === selectedPod);
      if (pod && pod.containers.length > 0 && !selectedContainer) {
        setSelectedContainer(pod.containers[0]);
      }
    }
  }, [selectedPod, pods, selectedContainer]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

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
      const response = await fetch(`/api/pods/${selectedNamespace}`);
      const data = await response.json();
      setPods(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchStaticLogs = async () => {
    if (!selectedPod || !selectedNamespace) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        lines: lineCount.toString(),
        previous: showPrevious.toString()
      });
      
      if (selectedContainer) {
        params.append('container', selectedContainer);
      }

      const response = await fetch(
        `/api/pod/${selectedNamespace}/${selectedPod}/logs?${params}`
      );
      const data = await response.json();
      
      if (data.success) {
        const logLines = data.logs.split('\n').filter(line => line.trim());
        setLogs(logLines.map((line, index) => ({
          id: index,
          timestamp: new Date().toISOString(),
          message: line
        })));
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startStreamingLogs = () => {
    if (!selectedPod || !selectedNamespace) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      setIsStreaming(true);
      setError(null);
      setLogs([]); // Clear existing logs when starting new stream
      
      const message = {
        type: 'subscribe_logs',
        namespace: selectedNamespace,
        pod: selectedPod,
        container: selectedContainer
      };
      
      wsRef.current.send(JSON.stringify(message));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'log') {
        const logLines = data.data.split('\n').filter(line => line.trim());
        logLines.forEach(line => {
          setLogs(prev => [...prev, {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            message: line
          }]);
        });
      } else if (data.type === 'error') {
        setError(data.data);
      }
    };

    wsRef.current.onerror = () => {
      setError('WebSocket connection failed');
      setIsStreaming(false);
    };

    wsRef.current.onclose = () => {
      setIsStreaming(false);
    };
  };

  const stopStreamingLogs = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsStreaming(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logContent = logs.map(log => 
      `${new Date(log.timestamp).toISOString()} ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPod}-${selectedContainer || 'default'}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getFilteredLogs = () => {
    if (!searchTerm) return logs;
    return logs.filter(log => 
      log.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const selectedPodData = pods.find(p => p.name === selectedPod);
  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Pod Logs</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          View and stream real-time logs from your pods
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column - Pod Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Namespace</label>
              <select
                value={selectedNamespace}
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500"
              >
                {namespaces.map(ns => (
                  <option key={ns.name} value={ns.name}>{ns.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pod</label>
              <select
                value={selectedPod}
                onChange={(e) => setSelectedPod(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500"
              >
                <option value="">Select a pod...</option>
                {pods.map(pod => (
                  <option key={pod.name} value={pod.name}>{pod.name}</option>
                ))}
              </select>
            </div>

            {selectedPodData && selectedPodData.containers.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Container</label>
                <select
                  value={selectedContainer}
                  onChange={(e) => setSelectedContainer(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500"
                >
                  {selectedPodData.containers.map(container => (
                    <option key={container} value={container}>{container}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Column - Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Line Count</label>
              <select
                value={lineCount}
                onChange={(e) => setLineCount(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500"
              >
                <option value={50}>50 lines</option>
                <option value={100}>100 lines</option>
                <option value={500}>500 lines</option>
                <option value={1000}>1000 lines</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showPrevious}
                  onChange={(e) => setShowPrevious(e.target.checked)}
                  className="rounded border-gray-300 text-radiant-purple-600 shadow-sm focus:border-radiant-purple-500 focus:ring-radiant-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show previous logs</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Show logs from previous container instance (if pod was restarted)
              </p>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Logs</label>
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter log messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={fetchStaticLogs}
            disabled={!selectedPod || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-radiant-purple-600 hover:bg-radiant-purple-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Fetch Logs'}
          </button>

          {!isStreaming ? (
            <button
              onClick={startStreamingLogs}
              disabled={!selectedPod}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Streaming
            </button>
          ) : (
            <button
              onClick={stopStreamingLogs}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
            >
              <Pause className="h-4 w-4 mr-2" />
              Stop Streaming
            </button>
          )}

          <button
            onClick={clearLogs}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </button>

          <button
            onClick={downloadLogs}
            disabled={logs.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
        </div>
      </div>

      {/* Status */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {isStreaming && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <Terminal className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Streaming logs from {selectedPod} 
                {selectedContainer && ` (${selectedContainer})`}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Logs Display */}
      {logs.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Logs</h3>
            <div className="text-sm text-gray-500">
              {filteredLogs.length} of {logs.length} lines
              {searchTerm && ` (filtered)`}
            </div>
          </div>
          
          <div 
            ref={logsContainerRef}
            className="log-container h-96 overflow-y-auto p-4 text-sm"
          >
            {filteredLogs.map((log) => (
              <div key={log.id} className="log-line">
                <span className="text-gray-400 text-xs mr-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-gray-200">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {logs.length === 0 && !loading && selectedPod && (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <Terminal className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No logs available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click "Fetch Logs" to load static logs or "Start Streaming" for real-time logs.
          </p>
        </div>
      )}
    </div>
  );
};

export default Logs;