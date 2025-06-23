import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { podsApi, namespacesApi } from '../services/api';
import { PodInfo } from '../types';

const Pods: React.FC = () => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPod, setSelectedPod] = useState<PodInfo | null>(null);

  const { data: namespaces } = useQuery<string[]>({
    queryKey: ['namespaces'],
    queryFn: namespacesApi.getAll,
  });

  const { data: pods, isLoading, error, refetch } = useQuery<PodInfo[]>({
    queryKey: ['pods', selectedNamespace],
    queryFn: () => selectedNamespace === 'all' ? podsApi.getAll() : podsApi.getByNamespace(selectedNamespace),
    refetchInterval: 30000,
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pod: PodInfo) => {
    setAnchorEl(event.currentTarget);
    setSelectedPod(pod);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPod(null);
  };

  const handleViewLogs = () => {
    if (selectedPod) {
      // TODO: Implement logs view
      console.log('View logs for:', selectedPod.name);
    }
    handleMenuClose();
  };

  const handleDeletePod = async () => {
    if (selectedPod) {
      try {
        await podsApi.delete(selectedPod.namespace, selectedPod.name);
        refetch();
      } catch (error) {
        console.error('Failed to delete pod:', error);
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredPods = pods?.filter(pod =>
    pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
        Failed to load pods. Please check your connection.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Pods</Typography>
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Search pods"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Namespace</InputLabel>
              <Select
                value={selectedNamespace}
                label="Namespace"
                onChange={(e) => setSelectedNamespace(e.target.value)}
              >
                <MenuItem value="all">All Namespaces</MenuItem>
                {namespaces?.map((ns) => (
                  <MenuItem key={ns} value={ns}>
                    {ns}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Phase</TableCell>
              <TableCell>Node</TableCell>
              <TableCell>Restarts</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPods.map((pod) => (
              <TableRow key={`${pod.namespace}-${pod.name}`}>
                <TableCell>{pod.name}</TableCell>
                <TableCell>{pod.namespace}</TableCell>
                <TableCell>
                  <Chip
                    label={pod.status}
                    color={getStatusColor(pod.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{pod.phase}</TableCell>
                <TableCell>{pod.nodeName || '-'}</TableCell>
                <TableCell>{pod.restartCount}</TableCell>
                <TableCell>
                  {new Date(pod.creationTimestamp).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, pod)}
                  >
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewLogs}>
          <ViewIcon sx={{ mr: 1 }} />
          View Logs
        </MenuItem>
        <MenuItem onClick={handleDeletePod}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Pod
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Pods; 