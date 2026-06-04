import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControlLabel,
  Grid,
  InputAdornment,
  LinearProgress,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Apps as AppsIcon,
  LinkOff as LinkOffIcon,
  CheckCircle as HealthyIcon,
  HourglassEmpty as StartingIcon,
  ErrorOutline as UnavailableIcon,
  PauseCircle as StoppedIcon,
} from '@mui/icons-material';
import { accessApi } from '../services/api';
import { AccessAppEntry, AccessNamespaceGroup } from '../types';
import { APPS_HIDE_SYSTEM_STORAGE_KEY, SYSTEM_NAMESPACES } from '../constants';

const readHideSystem = (): boolean => {
  try {
    const stored = localStorage.getItem(APPS_HIDE_SYSTEM_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {
    /* ignore */
  }
  return true;
};

const statusIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'running' || s === 'configured' || s === 'exposed') {
    return <HealthyIcon fontSize="small" color="success" />;
  }
  if (s === 'starting') return <StartingIcon fontSize="small" color="warning" />;
  if (s === 'stopped') return <StoppedIcon fontSize="small" color="disabled" />;
  return <UnavailableIcon fontSize="small" color="error" />;
};

const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  const s = status.toLowerCase();
  if (s === 'running' || s === 'configured' || s === 'exposed') return 'success';
  if (s === 'starting') return 'warning';
  if (s === 'stopped') return 'default';
  return 'error';
};

const AppCard: React.FC<{ app: AccessAppEntry }> = ({ app }) => {
  const hasUrls = app.urls.length > 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.15s ease',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
          <AppsIcon color="primary" sx={{ mt: 0.25 }} />
          <Box flex={1}>
            <Typography variant="h6" component="div">
              {app.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {app.kind} · {app.name}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={0.75} sx={{ mb: 1.5 }}>
          {statusIcon(app.status)}
          <Chip label={app.status} size="small" color={statusColor(app.status)} variant="outlined" />
        </Box>
        {app.statusDetail && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {app.statusDetail}
          </Typography>
        )}

        {hasUrls ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {app.urls.map((link) => (
              <Typography key={link.url} variant="caption" color="text.secondary" noWrap>
                {link.label}
                <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                  ({link.source})
                </Typography>
              </Typography>
            ))}
          </Box>
        ) : (
          <Box display="flex" gap={1} alignItems="flex-start">
            <LinkOffIcon fontSize="small" color="disabled" sx={{ mt: 0.25 }} />
            <Typography variant="body2" color="text.secondary">
              {app.noUrlReason ?? 'No public web address found for this app.'}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, flexWrap: 'wrap', gap: 1 }}>
        {hasUrls ? (
          app.urls.map((link) => (
            <Button
              key={link.url}
              variant="contained"
              size="small"
              component="a"
              href={link.url}
              target={link.openInNewTab ? '_blank' : '_self'}
              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
              endIcon={<OpenInNewIcon />}
            >
              {app.urls.length > 1 ? `Open · ${link.source}` : 'Open'}
            </Button>
          ))
        ) : (
          <Tooltip title="No link available">
            <span>
              <Button variant="outlined" size="small" disabled>
                Open
              </Button>
            </span>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

const MyApps: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hideSystem, setHideSystem] = useState(readHideSystem);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cluster-access'],
    queryFn: accessApi.getOverview,
    refetchInterval: 60000,
  });

  const handleHideSystemChange = (checked: boolean) => {
    setHideSystem(checked);
    try {
      localStorage.setItem(APPS_HIDE_SYSTEM_STORAGE_KEY, String(checked));
    } catch {
      /* ignore */
    }
  };

  const filteredNamespaces = useMemo(() => {
    if (!data?.namespaces) return [];
    const term = searchTerm.trim().toLowerCase();

    return data.namespaces
      .filter((group) => {
        if (hideSystem && (group.isSystemNamespace || SYSTEM_NAMESPACES.includes(group.namespace))) {
          return false;
        }
        return true;
      })
      .map((group) => {
        if (!term) return group;
        const apps = group.apps.filter(
          (app) =>
            app.displayName.toLowerCase().includes(term) ||
            app.name.toLowerCase().includes(term) ||
            app.kind.toLowerCase().includes(term) ||
            app.status.toLowerCase().includes(term) ||
            group.namespace.toLowerCase().includes(term) ||
            app.urls.some((u) => u.url.toLowerCase().includes(term) || u.label.toLowerCase().includes(term))
        );
        return { ...group, apps };
      })
      .filter((group) => group.apps.length > 0);
  }, [data, searchTerm, hideSystem]);

  const totalApps = filteredNamespaces.reduce((sum, g) => sum + g.apps.length, 0);

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load apps from the cluster.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Apps
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sites and applications discovered from your cluster (deployments, ingresses, and exposed services).
        For bookmarks you configure yourself, use{' '}
        <Typography component="a" href="/links" variant="body2" color="primary">
          External Links
        </Typography>
        .
      </Typography>

      <Box
        display="flex"
        flexWrap="wrap"
        gap={2}
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <TextField
          size="small"
          placeholder="Search apps or namespaces..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 280, flex: '1 1 280px', maxWidth: 480 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={hideSystem}
              onChange={(e) => handleHideSystemChange(e.target.checked)}
              color="primary"
            />
          }
          label="Hide system namespaces"
        />
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isFetching}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {isFetching && !isLoading && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {filteredNamespaces.length === 0 ? (
        <Alert severity="info">
          {searchTerm
            ? 'No apps match your search.'
            : hideSystem
              ? 'No user apps found. Try showing system namespaces or check that deployments exist in your cluster.'
              : 'No apps were discovered in the cluster.'}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {totalApps} app{totalApps !== 1 ? 's' : ''} in {filteredNamespaces.length} namespace
            {filteredNamespaces.length !== 1 ? 's' : ''}
            {data?.lastUpdated && (
              <> · Updated {new Date(data.lastUpdated).toLocaleString()}</>
            )}
          </Typography>

          {filteredNamespaces.map((group: AccessNamespaceGroup) => (
            <Box key={group.namespace} sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {group.namespace}
                {group.isSystemNamespace && (
                  <Chip label="System" size="small" sx={{ ml: 1 }} variant="outlined" />
                )}
              </Typography>
              <Grid container spacing={2}>
                {group.apps.map((app) => (
                  <Grid item xs={12} sm={6} md={4} key={`${group.namespace}-${app.kind}-${app.name}`}>
                    <AppCard app={app} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
};

export default MyApps;
