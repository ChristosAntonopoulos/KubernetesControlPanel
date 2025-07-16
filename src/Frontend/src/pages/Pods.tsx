import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Badge,
  Snackbar,
  Toolbar,
  Grid,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  RestartAlt as RestartIcon,
  Download as DownloadIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  CheckCircle as ReadyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { podsApi, namespacesApi } from '../services/api';
import { PodInfo } from '../types';

const Pods: React.FC = () => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPod, setSelectedPod] = useState<PodInfo | null>(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const queryClient = useQueryClient();

  const { data: namespaces } = useQuery<string[]>({
    queryKey: ['namespaces'],
    queryFn: namespacesApi.getAll,
  });

  const { data: pods, isLoading, error, refetch } = useQuery<PodInfo[]>({
    queryKey: ['pods', selectedNamespace],
    queryFn: () => selectedNamespace === 'all' ? podsApi.getAll() : podsApi.getByNamespace(selectedNamespace),
    refetchInterval: 30000,
  });

  const deletePodMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      podsApi.delete(namespace, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pods'] });
      setSnackbar({ open: true, message: 'Pod deleted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete pod', severity: 'error' });
    }
  });

  const restartPodMutation = useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      podsApi.restart(namespace, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pods'] });
      setSnackbar({ open: true, message: 'Pod restarted successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to restart pod', severity: 'error' });
    }
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pod: PodInfo) => {
    setAnchorEl(event.currentTarget);
    setSelectedPod(pod);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPod(null);
  };

  const handleViewLogs = async () => {
    if (selectedPod) {
      setLoadingLogs(true);
      try {
        const logsData = await podsApi.getLogs(selectedPod.namespace, selectedPod.name);
        setLogs(logsData);
        setLogsDialogOpen(true);
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to load logs', severity: 'error' });
      } finally {
        setLoadingLogs(false);
      }
    }
    handleMenuClose();
  };

  const handleDeletePod = async () => {
    if (selectedPod) {
      deletePodMutation.mutate({ namespace: selectedPod.namespace, name: selectedPod.name });
    }
    handleMenuClose();
  };

  const handleRestartPod = async () => {
    if (selectedPod) {
      restartPodMutation.mutate({ namespace: selectedPod.namespace, name: selectedPod.name });
    }
    handleMenuClose();
  };

  const handleDownloadLogs = () => {
    if (selectedPod && logs) {
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPod.name}-logs.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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

  const getReadyStatus = (pod: PodInfo) => {
    if (pod.ready) {
      return { status: 'Ready', color: 'success', icon: <ReadyIcon fontSize="small" /> };
    } else if (pod.status === 'Running') {
      return { status: 'Not Ready', color: 'warning', icon: <WarningIcon fontSize="small" /> };
    } else {
      return { status: 'Not Ready', color: 'error', icon: <ErrorIcon fontSize="small" /> };
    }
  };

  const getPodHealth = (pod: PodInfo) => {
    const readyStatus = getReadyStatus(pod);
    return (
      <Box display="flex" alignItems="center" gap={1}>
        {readyStatus.icon}
        <Chip
          label={readyStatus.status}
          color={readyStatus.color as any}
          size="small"
          variant="outlined"
        />
      </Box>
    );
  };

  const filteredPods = pods?.filter(pod =>
    pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const podStats = {
    total: filteredPods.length,
    running: filteredPods.filter(p => p.status === 'Running').length,
    pending: filteredPods.filter(p => p.status === 'Pending').length,
    failed: filteredPods.filter(p => p.status === 'Failed').length,
    ready: filteredPods.filter(p => p.ready).length,
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
        Failed to load pods. Please check your connection.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Pods</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Pod Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">{podStats.total}</Typography>
              <Typography variant="body2" color="textSecondary">Total Pods</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">{podStats.running}</Typography>
              <Typography variant="body2" color="textSecondary">Running</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">{podStats.pending}</Typography>
              <Typography variant="body2" color="textSecondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">{podStats.failed}</Typography>
              <Typography variant="body2" color="textSecondary">Failed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">{podStats.ready}</Typography>
              <Typography variant="body2" color="textSecondary">Ready</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              <TableCell>Ready</TableCell>
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
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {pod.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={pod.namespace} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  {getPodHealth(pod)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={pod.status}
                    color={getStatusColor(pod.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{pod.phase}</TableCell>
                <TableCell>{pod.nodeName || '-'}</TableCell>
                <TableCell>
                  <Badge badgeContent={pod.restartCount} color="warning">
                    <InfoIcon fontSize="small" />
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(pod.creationTimestamp).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="Actions">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, pod)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewLogs}>
          <ViewIcon sx={{ mr: 1 }} />
          View Logs
        </MenuItem>
        <MenuItem onClick={handleRestartPod}>
          <RestartIcon sx={{ mr: 1 }} />
          Restart Pod
        </MenuItem>
        <MenuItem onClick={handleDeletePod}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Pod
        </MenuItem>
      </Menu>

      {/* Logs Dialog */}
      <Dialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Pod Logs: {selectedPod?.name}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="textSecondary">
              {selectedPod?.namespace}
            </Typography>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownloadLogs}
              disabled={!logs}
            >
              Download
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingLogs ? (
            <LinearProgress />
          ) : (
            <Box
              component="pre"
              sx={{
                backgroundColor: 'grey.100',
                p: 2,
                borderRadius: 1,
                maxHeight: 400,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              }}
            >
              {logs || 'No logs available'}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Pods; 