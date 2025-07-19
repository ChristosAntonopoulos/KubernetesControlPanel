import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Server, 
  Database, 
  Activity, 
  FileText, 
  Terminal, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Pods from './components/Pods';
import Logs from './components/Logs';
import Metrics from './components/Metrics';
import Events from './components/Events';
import KubectlTerminal from './components/KubectlTerminal';
import PodDetails from './components/PodDetails';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppContent />
      </div>
    </Router>
  );
}

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [clusterInfo, setClusterInfo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchClusterInfo();
  }, []);

  const fetchClusterInfo = async () => {
    try {
      const response = await fetch('/api/cluster/info');
      const data = await response.json();
      setClusterInfo(data);
    } catch (error) {
      console.error('Failed to fetch cluster info:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Server, current: location.pathname === '/' },
    { name: 'Pods', href: '/pods', icon: Database, current: location.pathname === '/pods' },
    { name: 'Logs', href: '/logs', icon: FileText, current: location.pathname === '/logs' },
    { name: 'Metrics', href: '/metrics', icon: Activity, current: location.pathname === '/metrics' },
    { name: 'Events', href: '/events', icon: Settings, current: location.pathname === '/events' },
    { name: 'Terminal', href: '/terminal', icon: Terminal, current: location.pathname === '/terminal' },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-gray-900 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {isSidebarOpen && (
            <h1 className="text-white font-bold text-lg">K8s Control Panel</h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-400 hover:text-white p-1"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Cluster Info */}
        {isSidebarOpen && clusterInfo && (
          <div className="p-4 border-b border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Cluster Version</div>
            <div className="text-white text-sm font-mono">{clusterInfo.version}</div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    {isSidebarOpen && item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pods" element={<Pods />} />
            <Route path="/pod/:namespace/:name" element={<PodDetails />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/events" element={<Events />} />
            <Route path="/terminal" element={<KubectlTerminal />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;