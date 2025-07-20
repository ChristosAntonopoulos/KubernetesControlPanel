import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  NetworkCheck as NetworkIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { podsApi } from '../services/api';
import { PodInfo, PodMetrics, PodResourceUsage } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PodMetricsProps {
  open: boolean;
  onClose: () => void;
  pod: PodInfo;
}

const PodMetricsComponent: React.FC<PodMetricsProps> = ({ open, onClose, pod }) => {
  const [historyHours, setHistoryHours] = useState(24);

  const { data: currentMetrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['pod-metrics', pod.namespace, pod.name],
    queryFn: () => podsApi.getMetrics(pod.namespace, pod.name),
    enabled: open,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: resourceHistory, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['pod-resource-history', pod.namespace, pod.name, historyHours],
    queryFn: () => podsApi.getResourceHistory(pod.namespace, pod.name, historyHours),
    enabled: open,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCpu = (millicores: number) => {
    return millicores >= 1000 ? `${(millicores / 1000).toFixed(2)} cores` : `${millicores}m`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Prepare chart data
  const chartData = {
    labels: resourceHistory?.map(h => new Date(h.timestamp).toLocaleTimeString()) || [],
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: resourceHistory?.map(h => h.cpuUsagePercentage || 0) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Memory Usage (%)',
        data: resourceHistory?.map(h => h.memoryUsagePercentage || 0) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Resource Usage - Last ${historyHours} Hours`,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Percentage (%)',
        },
        min: 0,
        max: 100,
      },
    },
  };

  const latestUsage = resourceHistory?.[resourceHistory.length - 1];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <TimelineIcon />
            <Typography variant="h6">
              Pod Metrics - {pod.name}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton onClick={() => { refetchMetrics(); refetchHistory(); }} size="small">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box mb={3}>
          <FormControl size="small" sx={{ minWidth: 120, mb: 2 }}>
            <InputLabel>History Period</InputLabel>
            <Select
              value={historyHours}
              label="History Period"
              onChange={(e) => setHistoryHours(Number(e.target.value))}
            >
              <MenuItem value={1}>1 Hour</MenuItem>
              <MenuItem value={6}>6 Hours</MenuItem>
              <MenuItem value={24}>24 Hours</MenuItem>
              <MenuItem value={72}>3 Days</MenuItem>
              <MenuItem value={168}>1 Week</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {(metricsError || historyError) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {metricsError && !currentMetrics && "Unable to load current metrics. "}
            {historyError && "Unable to load historical data. "}
            This may indicate that metrics-server is not installed or configured properly.
          </Alert>
        )}

        {/* Current Metrics Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CpuIcon color="primary" />
                  <Typography variant="h6">CPU Usage</Typography>
                </Box>
                {currentMetrics ? (
                  <Box>
                    <Typography variant="h4" color="primary">
                      {formatCpu(currentMetrics.totalCpuUsage)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current CPU consumption
                    </Typography>
                  </Box>
                ) : latestUsage ? (
                  <Box>
                    <Typography variant="h4" color="primary">
                      {formatPercentage(latestUsage.cpuUsagePercentage || 0)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={latestUsage.cpuUsagePercentage || 0} 
                      sx={{ mt: 1 }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No metrics available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <MemoryIcon color="secondary" />
                  <Typography variant="h6">Memory Usage</Typography>
                </Box>
                {currentMetrics ? (
                  <Box>
                    <Typography variant="h4" color="secondary">
                      {formatBytes(currentMetrics.totalMemoryUsage)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current memory consumption
                    </Typography>
                  </Box>
                ) : latestUsage ? (
                  <Box>
                    <Typography variant="h4" color="secondary">
                      {formatPercentage(latestUsage.memoryUsagePercentage || 0)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={latestUsage.memoryUsagePercentage || 0} 
                      color="secondary"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No metrics available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Container Metrics Table */}
        {currentMetrics?.containers && currentMetrics.containers.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Container Resource Usage</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Container</TableCell>
                      <TableCell align="right">CPU Usage</TableCell>
                      <TableCell align="right">Memory Usage</TableCell>
                      <TableCell align="right">CPU Requests</TableCell>
                      <TableCell align="right">Memory Requests</TableCell>
                      <TableCell align="right">CPU Limits</TableCell>
                      <TableCell align="right">Memory Limits</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentMetrics.containers.map((container) => (
                      <TableRow key={container.name}>
                        <TableCell component="th" scope="row">
                          <Chip label={container.name} size="small" />
                        </TableCell>
                        <TableCell align="right">{formatCpu(container.cpuUsage)}</TableCell>
                        <TableCell align="right">{formatBytes(container.memoryUsage)}</TableCell>
                        <TableCell align="right">
                          {container.cpuRequests ? formatCpu(container.cpuRequests) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {container.memoryRequests ? formatBytes(container.memoryRequests) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {container.cpuLimits ? formatCpu(container.cpuLimits) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {container.memoryLimits ? formatBytes(container.memoryLimits) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Historical Chart */}
        {resourceHistory && resourceHistory.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Resource Usage History</Typography>
              <Box sx={{ height: 400 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Additional Resource Stats */}
        {latestUsage && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Additional Statistics</Typography>
              <Grid container spacing={2}>
                {latestUsage.networkRxBytes && (
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <NetworkIcon fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Network RX
                        </Typography>
                        <Typography variant="body1">
                          {formatBytes(latestUsage.networkRxBytes)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {latestUsage.networkTxBytes && (
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <NetworkIcon fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Network TX
                        </Typography>
                        <Typography variant="body1">
                          {formatBytes(latestUsage.networkTxBytes)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {latestUsage.filesystemUsage && (
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StorageIcon fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Filesystem
                        </Typography>
                        <Typography variant="body1">
                          {formatBytes(latestUsage.filesystemUsage)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PodMetricsComponent;