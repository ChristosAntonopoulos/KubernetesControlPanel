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