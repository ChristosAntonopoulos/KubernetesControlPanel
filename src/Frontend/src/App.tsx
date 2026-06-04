import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pods from './pages/Pods';
import Nodes from './pages/Nodes';
import Namespaces from './pages/Namespaces';
import Deployments from './pages/Deployments';
import ExternalLinks from './pages/ExternalLinks';

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pods" element={<Pods />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/nodes" element={<Nodes />} />
          <Route path="/namespaces" element={<Namespaces />} />
          <Route path="/links" element={<ExternalLinks />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App; 