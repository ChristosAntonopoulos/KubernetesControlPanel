import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { deploymentsApi, namespacesApi } from '../services/api';
import { DeploymentInfo } from '../types';
import { SYSTEM_NAMESPACES } from '../constants';
import { useIsMobile } from '../hooks/useIsMobile';

const Deployments: React.FC = () => {
  const isMobile = useIsMobile();
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [scaleInputs, setScaleInputs] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const queryClient = useQueryClient();

  const { data: namespaces } = useQuery({
    queryKey: ['namespaces'],
    queryFn: namespacesApi.getAll,
  });

  const { data: deployments, isLoading, error, refetch } = useQuery<DeploymentInfo[]>({
    queryKey: ['deployments', selectedNamespace],
    queryFn: () =>
      selectedNamespace === 'all'
        ? deploymentsApi.getAll()
        : deploymentsApi.getByNamespace(selectedNamespace),
    refetchInterval: 30000,
  });

  const scaleMutation = useMutation({
    mutationFn: ({
      namespace,
      name,
      replicas,
    }: {
      namespace: string;
      name: string;
      replicas: number;
    }) => deploymentsApi.scale(namespace, name, replicas),
    onSuccess: (result) => {
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Scaled ${result.name} to ${result.newReplicas} replica(s)`,
          severity: 'success',
        });
        queryClient.invalidateQueries({ queryKey: ['deployments'] });
      } else {
        setSnackbar({
          open: true,
          message: result.errorMessage || 'Failed to scale deployment',
          severity: 'error',
        });
      }
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to scale deployment', severity: 'error' });
    },
  });

  const filteredDeployments = useMemo(() => {
    if (!deployments) return [];
    const term = searchTerm.trim().toLowerCase();
    return deployments.filter((d) => {
      if (term && !d.name.toLowerCase().includes(term) && !d.namespace.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [deployments, searchTerm]);

  const getScaleValue = (deployment: DeploymentInfo) => {
    const key = `${deployment.namespace}/${deployment.name}`;
    return scaleInputs[key] ?? String(deployment.replicas);
  };

  const setScaleValue = (deployment: DeploymentInfo, value: string) => {
    const key = `${deployment.namespace}/${deployment.name}`;
    setScaleInputs((prev) => ({ ...prev, [key]: value }));
  };

  const applyScale = (deployment: DeploymentInfo, replicas: number) => {
    if (replicas < 0 || Number.isNaN(replicas)) {
      setSnackbar({ open: true, message: 'Replica count must be 0 or greater', severity: 'error' });
      return;
    }
    scaleMutation.mutate({
      namespace: deployment.namespace,
      name: deployment.name,
      replicas,
    });
  };

  const adjustReplicas = (deployment: DeploymentInfo, delta: number) => {
    const next = Math.max(0, deployment.replicas + delta);
    setScaleValue(deployment, String(next));
    applyScale(deployment, next);
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'success';
      case 'progressing':
        return 'warning';
      case 'scaled to zero':
        return 'info';
      default:
        return 'error';
    }
  };

  const renderScaleControls = (deployment: DeploymentInfo, fullWidth = false) => (
    <Box
      display="flex"
      alignItems="center"
      justifyContent={fullWidth ? 'stretch' : 'center'}
      gap={0.5}
      flexWrap="wrap"
      width={fullWidth ? '100%' : 'auto'}
    >
      <IconButton
        size="small"
        aria-label="decrease replicas"
        onClick={() => adjustReplicas(deployment, -1)}
        disabled={scaleMutation.isPending}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <TextField
        size="small"
        type="number"
        inputProps={{ min: 0, style: { width: fullWidth ? undefined : 56, textAlign: 'center' } }}
        value={getScaleValue(deployment)}
        onChange={(e) => setScaleValue(deployment, e.target.value)}
        disabled={scaleMutation.isPending}
        sx={fullWidth ? { flex: 1, minWidth: 72 } : undefined}
      />
      <IconButton
        size="small"
        aria-label="increase replicas"
        onClick={() => adjustReplicas(deployment, 1)}
        disabled={scaleMutation.isPending}
      >
        <AddIcon fontSize="small" />
      </IconButton>
      <Button
        size="small"
        variant="outlined"
        onClick={() => applyScale(deployment, parseInt(getScaleValue(deployment), 10))}
        disabled={scaleMutation.isPending}
        sx={fullWidth ? { flexShrink: 0 } : undefined}
      >
        Apply
      </Button>
    </Box>
  );

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load deployments. Check API connectivity and RBAC.</Alert>;
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={isMobile ? 'flex-start' : 'center'}
        flexDirection={isMobile ? 'column' : 'row'}
        gap={isMobile ? 1.5 : 0}
        mb={1}
      >
        <Typography variant={isMobile ? 'h5' : 'h4'}>Deployments</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          fullWidth={isMobile}
          variant={isMobile ? 'outlined' : 'text'}
        >
          Refresh
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Scale replica counts up or down, including zero. Pods are recreated by the deployment controller when scaling up.
      </Typography>

      <Box
        display="flex"
        gap={2}
        flexWrap="wrap"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        mb={2}
      >
        <FormControl size="small" sx={{ minWidth: isMobile ? 0 : 180, width: isMobile ? '100%' : 'auto' }}>
          <InputLabel>Namespace</InputLabel>
          <Select
            value={selectedNamespace}
            label="Namespace"
            onChange={(e) => setSelectedNamespace(e.target.value)}
          >
            <MenuItem value="all">All namespaces</MenuItem>
            {namespaces?.map((ns) => (
              <MenuItem key={ns} value={ns}>
                {ns}
                {SYSTEM_NAMESPACES.includes(ns) ? ' (system)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: isMobile ? 0 : 200, width: isMobile ? '100%' : 'auto' }}
        />
      </Box>

      {filteredDeployments.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No deployments found
            </Typography>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {filteredDeployments.map((deployment) => (
            <Card key={`${deployment.namespace}/${deployment.name}`} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ wordBreak: 'break-word', lineHeight: 1.3, mb: 0.75 }}
                >
                  {deployment.name}
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                  <Chip label={deployment.namespace} size="small" variant="outlined" />
                  <Chip
                    label={deployment.status}
                    size="small"
                    color={getStatusColor(deployment.status)}
                  />
                </Stack>

                <Grid container spacing={1.25} sx={{ mb: 1.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Replicas
                    </Typography>
                    <Typography variant="body2">{deployment.replicas}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Ready
                    </Typography>
                    <Typography variant="body2">
                      {deployment.readyReplicas}/{deployment.replicas}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                  Scale
                </Typography>
                {renderScaleControls(deployment, true)}
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Namespace</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Replicas</TableCell>
                <TableCell align="center">Ready</TableCell>
                <TableCell align="center">Scale</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDeployments.map((deployment) => (
                <TableRow key={`${deployment.namespace}/${deployment.name}`} hover>
                  <TableCell>{deployment.name}</TableCell>
                  <TableCell>{deployment.namespace}</TableCell>
                  <TableCell>
                    <Chip
                      label={deployment.status}
                      size="small"
                      color={getStatusColor(deployment.status)}
                    />
                  </TableCell>
                  <TableCell align="center">{deployment.replicas}</TableCell>
                  <TableCell align="center">
                    {deployment.readyReplicas}/{deployment.replicas}
                  </TableCell>
                  <TableCell align="center">{renderScaleControls(deployment)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Deployments;
