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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Tooltip,
  Badge,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  RestartAlt as RestartIcon,
  Timeline as MetricsIcon,
  Info as InfoIcon,
  Description as LogsIcon,
  History as HistoryIcon,
  Event as EventIcon,
  PlayArrow as StartIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { podsApi, namespacesApi } from '../services/api';
import { PodInfo, PodRestartResult } from '../types';
import LogViewer from '../components/LogViewer';
import PodMetrics from '../components/PodMetrics';
import PodDetails from '../components/PodDetails';

const Pods: React.FC = () => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPod, setSelectedPod] = useState<PodInfo | null>(null);
  
  // Dialog states
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  
  // Snackbar states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [isRestarting, setIsRestarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Action handlers
  const handleViewDetails = () => {
    setDetailsOpen(true);
    handleMenuClose();
  };

  const handleViewLogs = () => {
    setLogViewerOpen(true);
    handleMenuClose();
  };

  const handleViewPreviousLogs = () => {
    setLogViewerOpen(true);
    handleMenuClose();
  };

  const handleViewMetrics = () => {
    setMetricsOpen(true);
    handleMenuClose();
  };

  const handleRestartPod = () => {
    setRestartConfirmOpen(true);
    handleMenuClose();
  };

  const handleDeletePod = () => {
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const confirmRestart = async (withLogs: boolean = false) => {
    if (!selectedPod) return;
    
    setIsRestarting(true);
    setRestartConfirmOpen(false);
    
    try {
      if (withLogs) {
        const result: PodRestartResult = await podsApi.restartWithLogs(selectedPod.namespace, selectedPod.name);
        if (result.success) {
          showSnackbar(
            `Pod ${selectedPod.name} restarted successfully. Logs preserved.`,
            'success'
          );
          // You could show the preserved logs in a dialog here
          console.log('Pre-restart logs:', result.preRestartLogs);
        } else {
          showSnackbar(
            `Failed to restart pod: ${result.errorMessage}`,
            'error'
          );
        }
      } else {
        const success = await podsApi.restart(selectedPod.namespace, selectedPod.name);
        if (success) {
          showSnackbar(`Pod ${selectedPod.name} restarted successfully`, 'success');
        } else {
          showSnackbar(`Failed to restart pod ${selectedPod.name}`, 'error');
        }
      }
      refetch();
    } catch (error: any) {
      showSnackbar(`Error restarting pod: ${error.message}`, 'error');
    } finally {
      setIsRestarting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPod) return;
    
    setIsDeleting(true);
    setDeleteConfirmOpen(false);
    
    try {
      const success = await podsApi.delete(selectedPod.namespace, selectedPod.name);
      if (success) {
        showSnackbar(`Pod ${selectedPod.name} deleted successfully`, 'success');
        refetch();
      } else {
        showSnackbar(`Failed to delete pod ${selectedPod.name}`, 'error');
      }
    } catch (error: any) {
      showSnackbar(`Error deleting pod: ${error.message}`, 'error');
    } finally {
      setIsDeleting(false);
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
      case 'succeeded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPhaseIcon = (phase: string, status: string) => {
    if (status.toLowerCase() === 'running') {
      return <StartIcon sx={{ color: 'green' }} />;
    }
    if (phase.toLowerCase() === 'failed') {
      return <WarningIcon sx={{ color: 'red' }} />;
    }
    return null;
  };

  const filteredPods = pods?.filter(pod =>
    pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const podStats = {
    total: filteredPods.length,
    running: filteredPods.filter(p => p.status.toLowerCase() === 'running').length,
    pending: filteredPods.filter(p => p.status.toLowerCase() === 'pending').length,
    failed: filteredPods.filter(p => p.status.toLowerCase() === 'failed').length,
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading pods...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load pods. Please check your connection and try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Pods Management</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="primary">{podStats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Total</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="success.main">{podStats.running}</Typography>
            <Typography variant="body2" color="text.secondary">Running</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="warning.main">{podStats.pending}</Typography>
            <Typography variant="body2" color="text.secondary">Pending</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 120 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="error.main">{podStats.failed}</Typography>
            <Typography variant="body2" color="text.secondary">Failed</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Search pods"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
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
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {filteredPods.length} pod(s) found
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Pods Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Phase</TableCell>
              <TableCell>Node</TableCell>
              <TableCell align="center">Ready</TableCell>
              <TableCell align="center">Restarts</TableCell>
              <TableCell>Age</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPods.map((pod) => (
              <TableRow key={`${pod.namespace}-${pod.name}`} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getPhaseIcon(pod.phase, pod.status)}
                    <Typography variant="body2" fontWeight="medium">
                      {pod.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={pod.namespace} 
                    size="small" 
                    variant="outlined"
                  />
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
                <TableCell align="center">
                  <Chip
                    label={pod.isReady ? 'Yes' : 'No'}
                    color={pod.isReady ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Badge 
                    badgeContent={pod.restartCount} 
                    color={pod.restartCount > 0 ? 'warning' : 'default'}
                    showZero
                  >
                    <Box sx={{ width: 20, height: 20 }} />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Tooltip title={new Date(pod.creationTimestamp).toLocaleString()}>
                    <Typography variant="body2">
                      {new Date(pod.creationTimestamp).toLocaleDateString()}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, pod)}
                    disabled={isRestarting || isDeleting}
                  >
                    <MoreIcon />
                  </IconButton>
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
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleViewLogs}>
          <ListItemIcon>
            <LogsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Logs</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleViewPreviousLogs}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Previous Logs</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleViewMetrics}>
          <ListItemIcon>
            <MetricsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Metrics</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleRestartPod} sx={{ color: 'warning.main' }}>
          <ListItemIcon>
            <RestartIcon fontSize="small" sx={{ color: 'warning.main' }} />
          </ListItemIcon>
          <ListItemText>Restart Pod</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleDeletePod} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete Pod</ListItemText>
        </MenuItem>
      </Menu>

      {/* Restart Confirmation Dialog */}
      <Dialog open={restartConfirmOpen} onClose={() => setRestartConfirmOpen(false)}>
        <DialogTitle>Restart Pod</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restart pod <strong>{selectedPod?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestartConfirmOpen(false)}>Cancel</Button>
          <Button onClick={() => confirmRestart(false)} color="warning">
            Simple Restart
          </Button>
          <Button onClick={() => confirmRestart(true)} color="primary" variant="contained">
            Restart with Log Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Pod</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete pod <strong>{selectedPod?.name}</strong>? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Component Dialogs */}
      {selectedPod && (
        <>
          <LogViewer
            open={logViewerOpen}
            onClose={() => setLogViewerOpen(false)}
            pod={selectedPod}
          />
          <PodMetrics
            open={metricsOpen}
            onClose={() => setMetricsOpen(false)}
            pod={selectedPod}
          />
          <PodDetails
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            pod={selectedPod}
          />
        </>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Pods; 