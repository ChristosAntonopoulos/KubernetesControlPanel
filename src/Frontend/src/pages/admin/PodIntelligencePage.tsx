import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { ArrowBack as BackIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { podsApi, resourcesApi } from '../../services/api';
import LogViewer from '../../components/LogViewer';

const PodIntelligencePage: React.FC = () => {
  const { namespace, podName } = useParams<{ namespace: string; podName: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [yaml, setYaml] = useState<string | null>(null);
  const [snack, setSnack] = useState('');

  const { data: pod, isLoading, error } = useQuery({
    queryKey: ['pod', namespace, podName],
    queryFn: () => podsApi.getDetails(namespace!, podName!),
    enabled: Boolean(namespace && podName),
    refetchInterval: 30000,
  });

  const { data: events } = useQuery({
    queryKey: ['pod-events', namespace, podName],
    queryFn: () => podsApi.getEvents(namespace!, podName!),
    enabled: Boolean(namespace && podName),
  });

  const deleteMutation = useMutation({
    mutationFn: () => podsApi.delete(namespace!, podName!),
    onSuccess: () => {
      setSnack('Pod deleted');
      navigate(-1);
    },
    onError: () => setSnack('Failed to delete pod'),
  });

  const loadYaml = async () => {
    const result = await resourcesApi.getYaml(namespace!, 'pod', podName!);
    setYaml(result.yaml);
    setTab(3);
  };

  if (isLoading) return <LinearProgress />;
  if (error || !pod) return <Alert severity="error">Pod not found.</Alert>;

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>

      <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="flex-start" gap={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{pod.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Namespace: {pod.namespace} · Status: {pod.status} · Node: {pod.nodeName ?? '—'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pod IP: {pod.podIP ?? '—'} · Restarts: {pod.restartCount}
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="contained" onClick={() => setShowLogs(true)}>Stream logs</Button>
          <Button variant="outlined" onClick={loadYaml}>View YAML</Button>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              if (window.confirm(`Delete pod ${pod.name}?`)) deleteMutation.mutate();
            }}
          >
            Delete pod
          </Button>
        </Box>
      </Box>

      {!pod.isReady && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This pod is not ready.
          {pod.containers.some((c) => c.state === 'CrashLoopBackOff') &&
            ' A container is in CrashLoopBackOff — check logs and events.'}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="Containers" />
        <Tab label="Events" />
        <Tab label="YAML" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Health summary</Typography>
                <Typography variant="body2" color="text.secondary">
                  Phase: {pod.phase} · Ready: {pod.isReady ? 'Yes' : 'No'}
                </Typography>
                {pod.containers.map((c) => (
                  <Box key={c.name} sx={{ mt: 1 }}>
                    <Chip label={c.name} size="small" sx={{ mr: 1 }} />
                    <Typography component="span" variant="body2">{c.state} — {c.image}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            {pod.containers.map((c) => (
              <Box key={c.name} sx={{ mb: 2 }}>
                <Typography fontWeight={600}>{c.name}</Typography>
                <Typography variant="body2" color="text.secondary">Image: {c.image}</Typography>
                <Typography variant="body2">
                  State: {c.state} · Ready: {c.ready ? 'Yes' : 'No'} · Restarts: {c.restartCount}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Box>
          {(events ?? []).length === 0 ? (
            <Alert severity="info">No events for this pod.</Alert>
          ) : (
            (events ?? []).map((e, i) => (
              <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(e.timestamp).toLocaleString()} · {e.type} · {e.reason}
                  </Typography>
                  <Typography variant="body2">{e.message}</Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {tab === 3 && (
        <Card>
          <CardContent>
            {yaml ? (
              <Box component="pre" sx={{ overflow: 'auto', fontSize: 12, maxHeight: 500, m: 0 }}>{yaml}</Box>
            ) : (
              <Button onClick={loadYaml}>Load YAML</Button>
            )}
          </CardContent>
        </Card>
      )}

      {showLogs && (
        <LogViewer open onClose={() => setShowLogs(false)} pod={pod} />
      )}

      <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
};

export default PodIntelligencePage;
