import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, Grid, LinearProgress, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { appsApi } from '../services/api';
import { DiscoveredApp } from '../types';
import { APPS_HIDE_SYSTEM_STORAGE_KEY } from '../constants';
import PortfolioHero from '../components/apps/PortfolioHero';
import PortfolioSummaryStrip from '../components/apps/PortfolioSummaryStrip';
import PortfolioFilters, { PortfolioFilterState } from '../components/apps/PortfolioFilters';
import PortfolioAppTile from '../components/apps/PortfolioAppTile';

const readHideSystem = (): boolean => {
  try {
    const stored = localStorage.getItem(APPS_HIDE_SYSTEM_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  } catch { /* ignore */ }
  return true;
};

const filterApps = (apps: DiscoveredApp[], filters: PortfolioFilterState): DiscoveredApp[] => {
  const term = filters.search.trim().toLowerCase();
  return apps.filter((app) => {
    if (filters.hideSystem && app.isSystem) return false;
    if (filters.environment !== 'all' && app.environment !== filters.environment) return false;
    if (filters.status !== 'all' && app.userStatus !== filters.status) return false;
    if (filters.hasLink && !app.primaryUrl && app.urls.length === 0) return false;
    if (!term) return true;
    return (
      app.displayName.toLowerCase().includes(term) ||
      app.description.toLowerCase().includes(term) ||
      app.environment.toLowerCase().includes(term) ||
      app.owner.toLowerCase().includes(term) ||
      app.tags.some((t) => t.toLowerCase().includes(term))
    );
  });
};

const groupByEnvironment = (apps: DiscoveredApp[]): Record<string, DiscoveredApp[]> => {
  const groups: Record<string, DiscoveredApp[]> = {};
  const order = ['Production', 'Staging', 'Development', 'Other'];
  for (const app of apps) {
    const env = app.environment || 'Other';
    if (!groups[env]) groups[env] = [];
    groups[env].push(app);
  }
  const sorted: Record<string, DiscoveredApp[]> = {};
  for (const key of [...order, ...Object.keys(groups).filter((k) => !order.includes(k))]) {
    if (groups[key]?.length) sorted[key] = groups[key];
  }
  return sorted;
};

const MyApps: React.FC = () => {
  const [filters, setFilters] = useState<PortfolioFilterState>({
    search: '',
    environment: 'all',
    status: 'all',
    hasLink: false,
    hideSystem: readHideSystem(),
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['apps'],
    queryFn: appsApi.getAll,
    refetchInterval: 60000,
  });

  const handleFiltersChange = (next: PortfolioFilterState) => {
    setFilters(next);
    try {
      localStorage.setItem(APPS_HIDE_SYSTEM_STORAGE_KEY, String(next.hideSystem));
    } catch { /* ignore */ }
  };

  const filteredApps = useMemo(
    () => filterApps(data?.apps ?? [], filters),
    [data, filters]
  );

  const environments = useMemo(
    () => Array.from(new Set((data?.apps ?? []).map((a) => a.environment).filter(Boolean))).sort(),
    [data]
  );

  const needsAttention = filteredApps.filter((a) => a.userStatus === 'Degraded' || a.userStatus === 'Offline');
  const healthyApps = filteredApps.filter((a) => a.userStatus !== 'Degraded' && a.userStatus !== 'Offline');
  const grouped = groupByEnvironment(healthyApps);

  if (isLoading) return <LinearProgress />;

  if (error) {
    return <Alert severity="error">Failed to load apps from the cluster.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box display="flex" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching} size="small">
          Refresh
        </Button>
      </Box>

      <PortfolioHero summary={data?.summary} lastUpdated={data?.lastUpdated} />
      {data?.summary && <PortfolioSummaryStrip summary={data.summary} />}
      <PortfolioFilters filters={filters} environments={environments} onChange={handleFiltersChange} />

      {isFetching && !isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {filteredApps.length === 0 ? (
        <Alert severity="info">
          {filters.search || filters.status !== 'all'
            ? 'No apps match your filters.'
            : 'No applications discovered yet. Deploy workloads with app labels to populate your portfolio.'}
        </Alert>
      ) : (
        <>
          {needsAttention.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }} color="warning.main">
                Needs attention
              </Typography>
              <Grid container spacing={2}>
                {needsAttention.slice(0, 3).map((app) => (
                  <Grid item xs={12} sm={6} md={4} key={`${app.namespace}-${app.appKey}`}>
                    <PortfolioAppTile app={app} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {Object.entries(grouped).map(([env, apps]) => (
            <Box key={env} sx={{ mb: 4 }}>
              {Object.keys(grouped).length > 1 && (
                <Typography variant="h6" sx={{ mb: 2 }} fontWeight={600}>
                  {env}
                </Typography>
              )}
              <Grid container spacing={2}>
                {apps.map((app) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={`${app.namespace}-${app.appKey}`}>
                    <PortfolioAppTile app={app} />
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
