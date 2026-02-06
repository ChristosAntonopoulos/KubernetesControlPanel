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
  IconButton,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Storage as PodsIcon,
  Computer as NodesIcon,
  Folder as NamespacesIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { dashboardApi } from '../services/api';
import { DashboardInfo } from '../types';
import { SYSTEM_NAMESPACES } from '../constants';

const Dashboard: React.FC = () => {
  const { data: dashboardInfo, isLoading, error, refetch } = useQuery<DashboardInfo>({
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

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'normal':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'normal':
        return 'info';
      case 'warning':
        return 'warning';
      default:
        return 'error';
    }
  };

  const systemPodsCount = dashboardInfo.namespacePodDistribution
    .filter((ns) => SYSTEM_NAMESPACES.includes(ns.namespace))
    .reduce((sum, ns) => sum + ns.podCount, 0);
  const userPodsCount = dashboardInfo.totalPods - systemPodsCount;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Cluster Dashboard</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

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
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Chip
                  label={`${dashboardInfo.readyNodes} Ready`}
                  color="success"
                  size="small"
                />
                {dashboardInfo.totalNodes > dashboardInfo.readyNodes && (
                  <Chip
                    label={`${dashboardInfo.totalNodes - dashboardInfo.readyNodes} Not Ready`}
                    color="warning"
                    size="small"
                  />
                )}
              </Box>
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
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Chip
                  label={`${dashboardInfo.runningPods} Running`}
                  color="success"
                  size="small"
                />
                {dashboardInfo.pendingPods > 0 && (
                  <Chip
                    label={`${dashboardInfo.pendingPods} Pending`}
                    color="warning"
                    size="small"
                  />
                )}
                {dashboardInfo.failedPods > 0 && (
                  <Chip
                    label={`${dashboardInfo.failedPods} Failed`}
                    color="error"
                    size="small"
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                User pods: {userPodsCount} | System pods: {systemPodsCount}
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
                  color={dashboardInfo.resourceUsage.cpuUsagePercentage > 80 ? 'error' : 'primary'}
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
                  color={dashboardInfo.resourceUsage.memoryUsagePercentage > 80 ? 'error' : 'primary'}
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

      {/* Pod Status Breakdown */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pod Status Breakdown
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(dashboardInfo.podStatusBreakdown).map(([status, count]) => (
                      <TableRow key={status}>
                        <TableCell>
                          <Chip
                            label={status}
                            color={status === 'Running' ? 'success' : status === 'Pending' ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {count}
                          </Typography>
                        </TableCell>
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
                Top Namespaces by Pod Count
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
                    {dashboardInfo.namespacePodDistribution.slice(0, 5).map((ns) => (
                      <TableRow key={ns.namespace}>
                        <TableCell>
                          <Chip label={ns.namespace} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {ns.podCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            {ns.runningPods}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">
                            {ns.failedPods}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Events
          </Typography>
          <List>
            {dashboardInfo.recentEvents.slice(0, 10).map((event, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    {getEventIcon(event.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {event.involvedObjectName}
                        </Typography>
                        <Chip
                          label={event.type}
                          color={getEventColor(event.type) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {event.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.involvedObjectKind} • {event.namespace} • {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < dashboardInfo.recentEvents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard; 