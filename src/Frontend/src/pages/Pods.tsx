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
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  Badge,
  Snackbar,
  Grid,
  ListItemIcon,
  ListItemText,
  Divider,
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  RestartAlt as RestartIcon,
  Download as DownloadIcon,
  CheckCircle as ReadyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timeline as MetricsIcon,
  Description as LogsIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { podsApi, namespacesApi, nodesApi } from '../services/api';
import { PodInfo, PodMetrics as PodMetricsType } from '../types';
import { SYSTEM_NAMESPACES, PODS_HIDE_SYSTEM_STORAGE_KEY } from '../constants';
import LogViewer from '../components/LogViewer';
import PodMetrics from '../components/PodMetrics';
import PodDetails from '../components/PodDetails';
import { useIsMobile } from '../hooks/useIsMobile';

const getInitialHideSystemPods = (): boolean => {
  try {
    return localStorage.getItem(PODS_HIDE_SYSTEM_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const FALLBACK_EXTERNAL_PORT = process.env.REACT_APP_EXTERNAL_PORT || '30080';

const Pods: React.FC = () => {
  const isMobile = useIsMobile();
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hideSystemPods, setHideSystemPods] = useState<boolean>(getInitialHideSystemPods);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPod, setSelectedPod] = useState<PodInfo | null>(null);
  
  // Dialog states
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  
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

  const { data: nodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: nodesApi.getAll,
  });

  const { data: bulkMetrics } = useQuery<PodMetricsType[]>({
    queryKey: ['pods-metrics'],
    queryFn: podsApi.getBulkMetrics,
    refetchInterval: 30000,
  });

  const metricsByPod = React.useMemo(() => {
    const map: Record<string, PodMetricsType> = {};
    bulkMetrics?.forEach((m) => {
      map[`${m.namespace}/${m.name}`] = m;
    });
    return map;
  }, [bulkMetrics]);

  const formatCpu = (millicores: number) =>
    millicores >= 1000 ? `${(millicores / 1000).toFixed(2)} cores` : `${millicores}m`;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const nodeToExternalIP = React.useMemo(() => {
    const map: Record<string, string> = {};
    nodes?.forEach((node) => {
      const ip = node.externalIP || node.internalIP;
      if (ip) map[node.name] = ip;
    });
    return map;
  }, [nodes]);

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
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPod(pod);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const openPodDetails = (pod: PodInfo) => {
    setSelectedPod(pod);
    setDetailsOpen(true);
  };

  const getExternalPort = (pod: PodInfo) => {
    if (!pod.nodeName || !nodeToExternalIP[pod.nodeName]) return '-';
    if (pod.nodePorts && pod.nodePorts.length > 0) return pod.nodePorts.join(', ');
    return FALLBACK_EXTERNAL_PORT;
  };

  const getPodMetrics = (pod: PodInfo) => metricsByPod[`${pod.namespace}/${pod.name}`];

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

  const confirmRestart = async (withLogs: boolean = false) => {
    if (!selectedPod) return;

    setIsRestarting(true);
    try {
      if (withLogs) {
        const result = await podsApi.restartWithLogs(selectedPod.namespace, selectedPod.name);
        if (result.success) {
          showSnackbar('Pod restarted successfully with log backup', 'success');
          queryClient.invalidateQueries({ queryKey: ['pods'] });
        } else {
          showSnackbar(result.errorMessage || 'Failed to restart pod', 'error');
        }
      } else {
        const result = await podsApi.restart(selectedPod.namespace, selectedPod.name);
        if (result) {
          showSnackbar('Pod restarted successfully', 'success');
          queryClient.invalidateQueries({ queryKey: ['pods'] });
        } else {
          showSnackbar('Failed to restart pod', 'error');
        }
      }
    } catch {
      showSnackbar('Failed to restart pod', 'error');
    } finally {
      setIsRestarting(false);
      setRestartConfirmOpen(false);
      setSelectedPod(null);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPod) return;

    setIsDeleting(true);
    try {
      const success = await podsApi.delete(selectedPod.namespace, selectedPod.name);
      if (success) {
        showSnackbar('Pod deleted successfully', 'success');
        queryClient.invalidateQueries({ queryKey: ['pods'] });
      } else {
        showSnackbar('Failed to delete pod', 'error');
      }
    } catch {
      showSnackbar('Failed to delete pod', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setSelectedPod(null);
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
    switch (phase.toLowerCase()) {
      case 'running':
        return <ReadyIcon color="success" />;
      case 'pending':
        return <WarningIcon color="warning" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'succeeded':
        return <ReadyIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const filteredPods = pods?.filter(pod =>
    pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const displayedPods = hideSystemPods
    ? filteredPods.filter(pod => !SYSTEM_NAMESPACES.includes(pod.namespace))
    : filteredPods;

  const systemPodsHiddenCount = hideSystemPods
    ? filteredPods.filter(pod => SYSTEM_NAMESPACES.includes(pod.namespace)).length
    : 0;

  const handleHideSystemPodsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setHideSystemPods(checked);
    try {
      localStorage.setItem(PODS_HIDE_SYSTEM_STORAGE_KEY, String(checked));
    } catch {
      // ignore
    }
  };

  const podStats = {
    total: displayedPods.length,
    running: displayedPods.filter(p => p.status.toLowerCase() === 'running').length,
    pending: displayedPods.filter(p => p.status.toLowerCase() === 'pending').length,
    failed: displayedPods.filter(p => p.status.toLowerCase() === 'failed').length,
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

  const renderMobilePodCard = (pod: PodInfo) => {
    const metrics = getPodMetrics(pod);
    return (
      <Card key={`${pod.namespace}-${pod.name}`} variant="outlined">
        <CardContent sx={{ pb: '12px !important' }}>
          <Box display="flex" alignItems="flex-start" gap={1} mb={1.5}>
            <Box sx={{ mt: 0.25 }}>{getPhaseIcon(pod.phase, pod.status)}</Box>
            <Box flex={1} minWidth={0}>
              <Button
                variant="text"
                size="small"
                onClick={() => openPodDetails(pod)}
                sx={{
                  minWidth: 0,
                  p: 0,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'primary.main',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' },
                }}
              >
                {pod.name}
              </Button>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                <Chip label={pod.namespace} size="small" variant="outlined" />
                <Chip
                  label={pod.status}
                  color={getStatusColor(pod.status) as any}
                  size="small"
                />
                <Chip
                  label={pod.isReady ? 'Ready' : 'Not ready'}
                  color={pod.isReady ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
            <IconButton
              size="small"
              aria-label="pod actions"
              onClick={(e) => handleMenuOpen(e, pod)}
              disabled={isRestarting || isDeleting}
              sx={{ mt: -0.5 }}
            >
              <MoreIcon />
            </IconButton>
          </Box>

          <Grid container spacing={1.25}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">Node</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{pod.nodeName || '-'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">Age</Typography>
              <Typography variant="body2">
                {new Date(pod.creationTimestamp).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">CPU</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {metrics ? formatCpu(metrics.totalCpuUsage) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">Memory</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {metrics ? formatBytes(metrics.totalMemoryUsage) : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">Restarts</Typography>
              <Typography variant="body2">{pod.restartCount}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">Pod IP</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {pod.podIP || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">External IP</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {(pod.nodeName && nodeToExternalIP[pod.nodeName]) || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">External Port</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {getExternalPort(pod)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={isMobile ? 'flex-start' : 'center'}
        flexDirection={isMobile ? 'column' : 'row'}
        gap={isMobile ? 1.5 : 0}
        mb={3}
      >
        <Typography variant={isMobile ? 'h5' : 'h4'}>Pods Management</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isLoading}
          fullWidth={isMobile}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={1.5} mb={3}>
        {[
          { label: 'Total', value: podStats.total, color: 'primary.main' },
          { label: 'Running', value: podStats.running, color: 'success.main' },
          { label: 'Pending', value: podStats.pending, color: 'warning.main' },
          { label: 'Failed', value: podStats.failed, color: 'error.main' },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h6" sx={{ color: stat.color }}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems={isMobile ? 'stretch' : 'center'} flexWrap="wrap" flexDirection={isMobile ? 'column' : 'row'}>
            <TextField
              label="Search pods"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: isMobile ? 0 : 250, width: isMobile ? '100%' : 'auto' }}
            />
            <FormControl size="small" sx={{ minWidth: isMobile ? 0 : 200, width: isMobile ? '100%' : 'auto' }}>
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideSystemPods}
                  onChange={handleHideSystemPodsChange}
                  size="small"
                />
              }
              label="Hide system pods"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: isMobile ? 0 : 'auto' }}>
              {displayedPods.length} pod(s) found
              {hideSystemPods && systemPodsHiddenCount > 0 && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                  ({systemPodsHiddenCount} system pods hidden)
                </Typography>
              )}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Pods list / table or empty state */}
      {displayedPods.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No pods match your filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              Try clearing the search, choosing a different namespace, or unchecking &quot;Hide system pods&quot; to see more results.
            </Typography>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {displayedPods.map(renderMobilePodCard)}
        </Stack>
      ) : (
      <TableContainer component={Paper} sx={{ fontSize: '0.8rem' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Namespace</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Phase</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Pod IP</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Containers</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Node</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>External IP</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>External Port</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Ready</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Restarts</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>CPU</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Memory</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Age</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedPods.map((pod) => {
              const metrics = getPodMetrics(pod);
              return (
              <TableRow key={`${pod.namespace}-${pod.name}`} hover>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getPhaseIcon(pod.phase, pod.status)}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => openPodDetails(pod)}
                      sx={{
                        minWidth: 0,
                        p: 0,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' },
                      }}
                    >
                      {pod.name}
                    </Button>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  <Chip 
                    label={pod.namespace} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  <Chip
                    label={pod.status}
                    color={getStatusColor(pod.status) as any}
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{pod.phase}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  {pod.podIP ? (
                    <Tooltip title={pod.podIP}>
                      <Typography variant="caption" component="span" sx={{ fontFamily: 'monospace' }}>
                        {pod.podIP.length > 16 ? `${pod.podIP.slice(0, 16)}…` : pod.podIP}
                      </Typography>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                  {pod.containers?.length ?? 0}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{pod.nodeName || '-'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  {pod.nodeName && nodeToExternalIP[pod.nodeName] ? (
                    <Tooltip title={nodeToExternalIP[pod.nodeName]}>
                      <Typography variant="caption" component="span" sx={{ fontFamily: 'monospace' }}>
                        {nodeToExternalIP[pod.nodeName]}
                      </Typography>
                    </Tooltip>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {getExternalPort(pod)}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                  <Chip
                    label={pod.isReady ? 'Yes' : 'No'}
                    color={pod.isReady ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
                  <Badge 
                    badgeContent={pod.restartCount} 
                    color={pod.restartCount > 0 ? 'warning' : 'default'}
                    showZero
                  >
                    <Box sx={{ width: 20, height: 20 }} />
                  </Badge>
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {metrics ? formatCpu(metrics.totalCpuUsage) : '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {metrics ? formatBytes(metrics.totalMemoryUsage) : '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  <Tooltip title={new Date(pod.creationTimestamp).toLocaleString()}>
                    <Typography variant="caption" component="span">
                      {new Date(pod.creationTimestamp).toLocaleDateString()}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    aria-label="pod actions"
                    onClick={(e) => handleMenuOpen(e, pod)}
                    disabled={isRestarting || isDeleting}
                  >
                    <MoreIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { minWidth: 200 },
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

      {/* Logs Dialog */}
      <Dialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ wordBreak: 'break-word', mb: 1 }}>
            Pod Logs: {selectedPod?.name}
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Typography variant="subtitle2" color="textSecondary">
              {selectedPod?.namespace}
            </Typography>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownloadLogs}
              disabled={!logs}
              size="small"
            >
              Download
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
          {loadingLogs ? (
            <LinearProgress />
          ) : (
            <Box
              component="pre"
              sx={{
                backgroundColor: 'background.default',
                p: 2,
                borderRadius: 1,
                maxHeight: isMobile ? 'calc(100vh - 180px)' : 400,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
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