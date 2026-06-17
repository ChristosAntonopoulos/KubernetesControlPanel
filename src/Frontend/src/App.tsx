import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pods from './pages/Pods';
import Nodes from './pages/Nodes';
import Namespaces from './pages/Namespaces';
import Deployments from './pages/Deployments';
import MyApps from './pages/MyApps';
import AppDetailPage from './pages/AppDetailPage';
import AppOperationsPage from './pages/admin/AppOperationsPage';
import PodIntelligencePage from './pages/admin/PodIntelligencePage';

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/apps" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps" element={<MyApps />} />
          <Route path="/apps/:namespace/:appKey" element={<AppDetailPage />} />
          <Route path="/admin/apps/:namespace/:appKey" element={<AppOperationsPage />} />
          <Route path="/admin/pods/:namespace/:podName" element={<PodIntelligencePage />} />
          <Route path="/pods" element={<Pods />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/namespaces" element={<Namespaces />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;
