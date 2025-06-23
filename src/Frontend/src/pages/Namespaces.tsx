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
import { namespacesApi } from '../services/api';
import { NamespacePodCount } from '../types';

const Namespaces: React.FC = () => {
  const { data: namespaces, isLoading: namespacesLoading, error: namespacesError } = useQuery<string[]>({
    queryKey: ['namespaces'],
    queryFn: namespacesApi.getAll,
  });

  const { data: namespaceDetails, isLoading: detailsLoading, error: detailsError } = useQuery<NamespacePodCount[]>({
    queryKey: ['namespace-details'],
    queryFn: async () => {
      if (!namespaces) return [];
      const details = await Promise.all(
        namespaces.map(ns => namespacesApi.getDetails(ns))
      );
      return details.filter(detail => detail !== null) as NamespacePodCount[];
    },
    enabled: !!namespaces,
  });

  if (namespacesLoading || detailsLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (namespacesError || detailsError) {
    return (
      <Alert severity="error">
        Failed to load namespaces. Please check your connection.
      </Alert>
    );
  }

  if (!namespaces || !namespaceDetails) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Namespaces
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Namespaces
              </Typography>
              <Typography variant="h3" color="primary">
                {namespaces.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Pods
              </Typography>
              <Typography variant="h3" color="primary">
                {namespaceDetails.reduce((sum, ns) => sum + ns.podCount, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Running Pods
              </Typography>
              <Typography variant="h3" color="success.main">
                {namespaceDetails.reduce((sum, ns) => sum + ns.runningPods, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Namespace Details
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Namespace</TableCell>
                  <TableCell align="right">Total Pods</TableCell>
                  <TableCell align="right">Running Pods</TableCell>
                  <TableCell align="right">Failed Pods</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {namespaceDetails.map((ns) => (
                  <TableRow key={ns.namespace}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {ns.namespace}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{ns.podCount}</TableCell>
                    <TableCell align="right">
                      <Typography color="success.main">
                        {ns.runningPods}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={ns.failedPods > 0 ? 'error' : 'text.secondary'}>
                        {ns.failedPods}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={ns.failedPods > 0 ? 'Warning' : 'Healthy'}
                        color={ns.failedPods > 0 ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Namespaces; 