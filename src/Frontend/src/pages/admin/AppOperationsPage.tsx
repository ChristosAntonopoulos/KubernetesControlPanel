import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Snackbar,
  Stack,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  OpenInNew as OpenIcon,
  RestartAlt as RestartIcon,
} from '@mui/icons-material';
import { appsApi, deploymentsApi } from '../../services/api';
import LogViewer from '../../components/LogViewer';
import { PodInfo } from '../../types';
import { statusColor, statusLabel } from '../../utils/appStatus';
import { useIsMobile } from '../../hooks/useIsMobile';

const AppOperationsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { namespace, appKey } = useParams<{ namespace: string; appKey: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [logPod, setLogPod] = useState<PodInfo | null>(null);
  const [snack, setSnack] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['app-admin', namespace, appKey],
    queryFn: () => appsApi.getAdmin(namespace!, appKey!),
    enabled: Boolean(namespace && appKey),
    refetchInterval: 30000,
  });

  const restartMutation = useMutation({
    mutationFn: (dep: { ns: string; name: string }) => deploymentsApi.restart(dep.ns, dep.name),
    onSuccess: (r) => {
      setSnack(r.success ? 'Deployment restarted' : (r.errorMessage ?? 'Restart failed'));
      queryClient.invalidateQueries({ queryKey: ['app-admin', namespace, appKey] });
    },
  });

  if (isLoading) return <LinearProgress />;
  if (error || !data) return <Alert severity="error">Failed to load app operations.</Alert>;

  const { app, overview, workloads, pods, services, ingresses, recentEvents } = data;
  const openUrl = app.primaryUrl ?? app.urls[0]?.url;

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/apps')} sx={{ mb: 2 }}>
        Back to My Apps
      </Button>

      <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="flex-start" gap={2} sx={{ mb: 3 }}>
        <Box flex={1} minWidth={0}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} sx={{ wordBreak: 'break-word' }}>
            {app.displayName}
          </Typography>
          <StackChips app={app} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, wordBreak: 'break-word' }}>
            Namespace: {app.namespace} · App key: {app.appKey}
            {app.owner && <> · Owner: {app.owner}</>}
          </Typography>
        </Box>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={1} sx={{ width: isMobile ? '100%' : 'auto' }}>
          {openUrl && (
            <Button
              component="a"
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenIcon />}
              fullWidth={isMobile}
              variant="contained"
            >
              Open App
            </Button>
          )}
          <Button
            component={RouterLink}
            to={`/apps/${encodeURIComponent(app.namespace)}/${encodeURIComponent(app.appKey)}`}
            variant="outlined"
            fullWidth={isMobile}
          >
            User View
          </Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">{overview.headline}</Typography>
          {overview.reason && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{overview.reason}</Typography>
          )}
          {overview.suggestedSteps.length > 0 && (
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              {overview.suggestedSteps.map((s) => (
                <li key={s}><Typography variant="body2">{s}</Typography></li>
              ))}
            </Box>
          )}
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
            Workloads: {workloads.length} · Pods: {app.readyPods}/{app.totalPods} ready ·
            Restarts (approx): {data.restartsLast24Hours} · Services: {services.length} · Ingresses: {ingresses.length}
          </Typography>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab label="Overview" />
        <Tab label="Workloads" />
        <Tab label="Pods" />
        <Tab label="Services" />
        <Tab label="Ingress" />
        <Tab label="Events" />
      </Tabs>

      {tab === 0 && (
        <Alert severity={app.userStatus === 'Healthy' ? 'success' : 'warning'}>
          {overview.recentWarning ?? app.availabilitySummary ?? 'No recent warnings.'}
        </Alert>
      )}

      {tab === 1 && (
        isMobile ? (
          <Stack spacing={1.5}>
            {workloads.map((w) => (
              <Card key={w.name} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ wordBreak: 'break-word', mb: 0.75 }}>
                    {w.name}
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    <Chip label={w.type} size="small" variant="outlined" />
                    <Chip label={w.status} size="small" />
                  </Stack>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Ready: {w.readyReplicas}/{w.replicas}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block', mb: 1.5 }}>
                    {w.image}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<RestartIcon />}
                    onClick={() => restartMutation.mutate({ ns: w.namespace, name: w.name })}
                    disabled={restartMutation.isPending}
                    fullWidth
                    variant="outlined"
                  >
                    Restart
                  </Button>
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
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ready</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workloads.map((w) => (
                  <TableRow key={w.name}>
                    <TableCell>{w.name}</TableCell>
                    <TableCell>{w.type}</TableCell>
                    <TableCell><Chip label={w.status} size="small" /></TableCell>
                    <TableCell>{w.readyReplicas}/{w.replicas}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.image}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<RestartIcon />}
                        onClick={() => restartMutation.mutate({ ns: w.namespace, name: w.name })}
                        disabled={restartMutation.isPending}
                      >
                        Restart
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {tab === 2 && (
        isMobile ? (
          <Stack spacing={1.5}>
            {pods.map((p) => (
              <Card
                key={p.name}
                variant="outlined"
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/admin/pods/${encodeURIComponent(p.namespace)}/${encodeURIComponent(p.name)}`)}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ wordBreak: 'break-word', mb: 0.75 }}>
                    {p.name}
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    <Chip label={p.status} size="small" color={p.status === 'Running' ? 'success' : 'warning'} />
                    <Chip label={p.isReady ? 'Ready' : 'Not ready'} size="small" variant="outlined" />
                  </Stack>
                  <Grid container spacing={1} sx={{ mb: 1.5 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Restarts</Typography>
                      <Typography variant="body2">{p.restartCount}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Node</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{p.nodeName ?? '—'}</Typography>
                    </Grid>
                  </Grid>
                  <Button
                    size="small"
                    fullWidth
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogPod(p);
                    }}
                  >
                    View Logs
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pod</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ready</TableCell>
                  <TableCell>Restarts</TableCell>
                  <TableCell>Node</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pods.map((p) => (
                  <TableRow key={p.name} hover sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/pods/${encodeURIComponent(p.namespace)}/${encodeURIComponent(p.name)}`)}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell><Chip label={p.status} size="small" color={p.status === 'Running' ? 'success' : 'warning'} /></TableCell>
                    <TableCell>{p.isReady ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{p.restartCount}</TableCell>
                    <TableCell>{p.nodeName ?? '—'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="small" onClick={() => setLogPod(p)}>Logs</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {tab === 3 && (
        isMobile ? (
          <Stack spacing={1.5}>
            {services.map((s) => (
              <Card key={s.name} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ wordBreak: 'break-word', mb: 0.75 }}>
                    {s.name}
                  </Typography>
                  <Chip label={s.type} size="small" variant="outlined" sx={{ mb: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Cluster IP</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{s.clusterIP}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Pods</Typography>
                      <Typography variant="body2">{s.matchedPods}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" display="block">Ports</Typography>
                      <Typography variant="body2">{s.ports}</Typography>
                    </Grid>
                  </Grid>
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
                  <TableCell>Type</TableCell>
                  <TableCell>Cluster IP</TableCell>
                  <TableCell>Ports</TableCell>
                  <TableCell>Pods</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.type}</TableCell>
                    <TableCell>{s.clusterIP}</TableCell>
                    <TableCell>{s.ports}</TableCell>
                    <TableCell>{s.matchedPods}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {tab === 4 && (
        isMobile ? (
          <Stack spacing={1.5}>
            {ingresses.map((ing, i) => (
              <Card key={`${ing.name}-${i}`} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ wordBreak: 'break-word', mb: 1 }}>
                    {ing.host}
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" display="block">Path</Typography>
                      <Typography variant="body2">{ing.path}</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="caption" color="text.secondary" display="block">Service</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{ing.service}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary" display="block">TLS</Typography>
                      <Typography variant="body2">{ing.tlsEnabled ? 'Yes' : 'No'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Host</TableCell>
                  <TableCell>Path</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>TLS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ingresses.map((ing, i) => (
                  <TableRow key={`${ing.name}-${i}`}>
                    <TableCell>{ing.host}</TableCell>
                    <TableCell>{ing.path}</TableCell>
                    <TableCell>{ing.service}</TableCell>
                    <TableCell>{ing.tlsEnabled ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {tab === 5 && (
        <StackEvents events={recentEvents} />
      )}

      {logPod && (
        <LogViewer
          open
          onClose={() => setLogPod(null)}
          pod={logPod}
        />
      )}

      <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack('')} message={snack} />
    </Box>
  );
};

const StackChips: React.FC<{ app: { userStatus: string; environment: string } }> = ({ app }) => (
  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Chip label={statusLabel(app.userStatus)} color={statusColor(app.userStatus)} size="small" />
    {app.environment && <Chip label={app.environment} size="small" variant="outlined" />}
  </Box>
);

const StackEvents: React.FC<{ events: { type: string; reason: string; message: string; timestamp: string }[] }> = ({ events }) => (
  <Box>
    {events.length === 0 ? (
      <Alert severity="info">No recent events.</Alert>
    ) : (
      events.map((e, i) => (
        <Card key={i} variant="outlined" sx={{ mb: 1 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.disabled">
              {new Date(e.timestamp).toLocaleString()} · {e.type} · {e.reason}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{e.message}</Typography>
          </CardContent>
        </Card>
      ))
    )}
  </Box>
);

export default AppOperationsPage;
