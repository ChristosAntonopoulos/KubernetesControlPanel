import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { nodesApi } from '../services/api';
import { NodeInfo } from '../types';

const formatCpu = (millicores: number) =>
  millicores >= 1000 ? `${(millicores / 1000).toFixed(2)} cores` : `${millicores}m`;
const formatMemoryBytes = (bytes: number) => {
  const mi = bytes / (1024 * 1024);
  if (mi >= 1024) return `${(mi / 1024).toFixed(2)} Gi`;
  return `${mi.toFixed(1)} Mi`;
};
const parseCapacityCpuToCores = (s?: string): number => {
  if (!s) return 0;
  if (s.endsWith('m')) return parseInt(s, 10) / 1000;
  return parseFloat(s) || 0;
};
const parseCapacityMemoryToBytes = (s?: string): number => {
  if (!s) return 0;
  const n = parseFloat(s) || 0;
  if (s.endsWith('Ki')) return n * 1024;
  if (s.endsWith('Mi')) return n * 1024 * 1024;
  if (s.endsWith('Gi')) return n * 1024 * 1024 * 1024;
  return n;
};

const Nodes: React.FC = () => {
  const { data: nodes, isLoading, error } = useQuery<NodeInfo[]>({
    queryKey: ['nodes'],
    queryFn: nodesApi.getAll,
    refetchInterval: 30000,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'success';
      case 'notready':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'master':
      case 'control-plane':
        return 'primary';
      case 'worker':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load nodes. Please check your connection.
      </Alert>
    );
  }

  if (!nodes) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Nodes
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {nodes.map((node) => (
          <Grid item xs={12} md={6} key={node.name}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">{node.name}</Typography>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={node.status}
                      color={getStatusColor(node.status) as any}
                      size="small"
                    />
                    <Chip
                      label={node.role}
                      color={getRoleColor(node.role) as any}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    IP Addresses
                  </Typography>
                  <Typography variant="body2">
                    Internal: {node.internalIP || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    External: {node.externalIP || 'N/A'}
                  </Typography>
                </Box>

                {node.capacity && (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Capacity
                    </Typography>
                    <Typography variant="body2">
                      CPU: {node.capacity.cpu || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Memory: {node.capacity.memory || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Pods: {node.capacity.pods || 'N/A'}
                    </Typography>
                  </Box>
                )}

                {(node.cpuUsageMillicores != null || node.memoryUsageBytes != null) && (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Resource usage
                    </Typography>
                    {node.cpuUsageMillicores != null && (
                      <Box mb={1}>
                        <Typography variant="body2">
                          CPU: {formatCpu(node.cpuUsageMillicores)}
                          {node.capacity?.cpu && ` / ${node.capacity.cpu}`}
                        </Typography>
                        {node.capacity?.cpu && (
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              100,
                              (node.cpuUsageMillicores / 1000 / parseCapacityCpuToCores(node.capacity.cpu)) * 100
                            )}
                            sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                          />
                        )}
                      </Box>
                    )}
                    {node.memoryUsageBytes != null && (
                      <Box>
                        <Typography variant="body2">
                          Memory: {formatMemoryBytes(node.memoryUsageBytes)}
                          {node.capacity?.memory && ` / ${node.capacity.memory}`}
                        </Typography>
                        {node.capacity?.memory && (
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              100,
                              (node.memoryUsageBytes / parseCapacityMemoryToBytes(node.capacity.memory)) * 100
                            )}
                            color="secondary"
                            sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    System Info
                  </Typography>
                  <Typography variant="body2">
                    OS: {node.operatingSystem || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Architecture: {node.architecture || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Runtime: {node.containerRuntime || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    K8s Version: {node.kubernetesVersion || 'N/A'}
                  </Typography>
                </Box>

                {node.conditions && node.conditions.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Conditions
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Reason</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {node.conditions.map((condition, index) => (
                            <TableRow key={index}>
                              <TableCell>{condition.type}</TableCell>
                              <TableCell>
                                <Chip
                                  label={condition.status}
                                  color={condition.status === 'True' ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{condition.reason || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Nodes; 