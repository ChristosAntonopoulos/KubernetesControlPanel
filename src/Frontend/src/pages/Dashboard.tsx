import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Storage as PodsIcon,
  Computer as NodesIcon,
  Folder as NamespacesIcon,
} from '@mui/icons-material';
import { dashboardApi } from '../services/api';
import { DashboardInfo } from '../types';

const Dashboard: React.FC = () => {
  const { data: dashboardInfo, isLoading, error } = useQuery<DashboardInfo>({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardApi.getOverview,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

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
        Failed to load dashboard data. Please check your connection.
      </Alert>
    );
  }

  if (!dashboardInfo) {
    return null;
  }

  const getHealthIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'error';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cluster Dashboard
      </Typography>

      {/* Cluster Health Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            {getHealthIcon(dashboardInfo.healthStatus)}
            <Typography variant="h6">Cluster Health</Typography>
            <Chip
              label={dashboardInfo.healthStatus}
              color={getHealthColor(dashboardInfo.healthStatus) as any}
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date(dashboardInfo.lastUpdated).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <NodesIcon color="primary" />
                <Typography variant="h6">{dashboardInfo.totalNodes}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Nodes
              </Typography>
              <Typography variant="caption" color="success.main">
                {dashboardInfo.readyNodes} Ready
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <PodsIcon color="primary" />
                <Typography variant="h6">{dashboardInfo.totalPods}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Pods
              </Typography>
              <Typography variant="caption" color="success.main">
                {dashboardInfo.runningPods} Running
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <NamespacesIcon color="primary" />
                <Typography variant="h6">{dashboardInfo.totalNamespaces}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Namespaces
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {dashboardInfo.kubernetesVersion}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kubernetes Version
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resource Usage */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU Usage
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <LinearProgress
                  variant="determinate"
                  value={dashboardInfo.resourceUsage.cpuUsagePercentage}
                  sx={{ flexGrow: 1 }}
                />
                <Typography variant="body2">
                  {dashboardInfo.resourceUsage.cpuUsagePercentage.toFixed(1)}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {dashboardInfo.resourceUsage.usedCpu} / {dashboardInfo.resourceUsage.totalCpu}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <LinearProgress
                  variant="determinate"
                  value={dashboardInfo.resourceUsage.memoryUsagePercentage}
                  sx={{ flexGrow: 1 }}
                />
                <Typography variant="body2">
                  {dashboardInfo.resourceUsage.memoryUsagePercentage.toFixed(1)}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {dashboardInfo.resourceUsage.usedMemory} / {dashboardInfo.resourceUsage.totalMemory}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Namespace Pod Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Namespace Pod Distribution
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Namespace</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Running</TableCell>
                      <TableCell align="right">Failed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardInfo.namespacePodDistribution.map((ns) => (
                      <TableRow key={ns.namespace}>
                        <TableCell>{ns.namespace}</TableCell>
                        <TableCell align="right">{ns.podCount}</TableCell>
                        <TableCell align="right">{ns.runningPods}</TableCell>
                        <TableCell align="right">{ns.failedPods}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Events
              </Typography>
              <Box maxHeight={300} overflow="auto">
                {dashboardInfo.recentEvents.slice(0, 10).map((event, index) => (
                  <Box key={index} mb={1} p={1} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {event.reason}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 