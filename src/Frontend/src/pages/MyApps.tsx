import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Box, Button, Grid, LinearProgress, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { appsApi } from '../services/api';
import { AppSummaryStats, DiscoveredApp } from '../types';
import {
  getAppDisplayName,
  isWebOrFrontendApp,
} from '../utils/appPresentation';
import PortfolioHero from '../components/apps/PortfolioHero';
import PortfolioSummaryStrip from '../components/apps/PortfolioSummaryStrip';
import PortfolioFilters, { PortfolioFilterState, SortOption } from '../components/apps/PortfolioFilters';
import PortfolioAppTile from '../components/apps/PortfolioAppTile';

const buildSummary = (apps: DiscoveredApp[]): AppSummaryStats => {
  const stats: AppSummaryStats = {
    total: apps.length,
    healthy: 0,
    degraded: 0,
    offline: 0,
    starting: 0,
    unknown: 0,
  };
  for (const app of apps) {
    switch (app.userStatus) {
      case 'Healthy': stats.healthy++; break;
      case 'Degraded': stats.degraded++; break;
      case 'Offline': stats.offline++; break;
      case 'Starting': stats.starting++; break;
      default: stats.unknown++; break;
    }
  }
  return stats;
};

const statusOrder: Record<string, number> = {
  Offline: 0,
  Degraded: 1,
  Starting: 2,
  Unknown: 3,
  Healthy: 4,
};

const filterApps = (apps: DiscoveredApp[], filters: PortfolioFilterState): DiscoveredApp[] => {
  const term = filters.search.trim().toLowerCase();
  const filtered = apps.filter((app) => {
    if (!isWebOrFrontendApp(app)) return false;
    if (filters.environment !== 'all' && app.environment !== filters.environment) return false;
    if (filters.status !== 'all' && app.userStatus !== filters.status) return false;
    if (!term) return true;
    const name = getAppDisplayName(app).toLowerCase();
    return (
      name.includes(term) ||
      app.displayName.toLowerCase().includes(term) ||
      app.appKey.toLowerCase().includes(term) ||
      (app.primaryUrl ?? '').toLowerCase().includes(term) ||
      app.environment.toLowerCase().includes(term)
    );
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (filters.sort === 'status') {
      const diff = (statusOrder[a.userStatus] ?? 99) - (statusOrder[b.userStatus] ?? 99);
      if (diff !== 0) return diff;
    }
    const nameA = getAppDisplayName(a).toLowerCase();
    const nameB = getAppDisplayName(b).toLowerCase();
    const cmp = nameA.localeCompare(nameB);
    return filters.sort === 'name-desc' ? -cmp : cmp;
  });
  return sorted;
};

const MyApps: React.FC = () => {
  const [filters, setFilters] = useState<PortfolioFilterState>({
    search: '',
    environment: 'all',
    status: 'all',
    sort: 'name-asc' as SortOption,
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['apps'],
    queryFn: appsApi.getAll,
    refetchInterval: 60000,
  });

  const webApps = useMemo(
    () => (data?.apps ?? []).filter(isWebOrFrontendApp),
    [data]
  );

  const filteredApps = useMemo(
    () => filterApps(data?.apps ?? [], filters),
    [data, filters]
  );

  const summary = useMemo(() => buildSummary(webApps), [webApps]);

  const environments = useMemo(
    () => Array.from(new Set(webApps.map((a) => a.environment).filter(Boolean))).sort(),
    [webApps]
  );

  if (isLoading) return <LinearProgress />;

  if (error) {
    return <Alert severity="error">Failed to load apps from the cluster.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1440, mx: 'auto' }}>
      <Box display="flex" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
          disabled={isFetching}
          size="small"
          variant="outlined"
          sx={{ borderColor: 'rgba(148,163,184,0.2)' }}
        >
          Refresh
        </Button>
      </Box>

      <PortfolioHero appCount={webApps.length} lastUpdated={data?.lastUpdated} />
      {webApps.length > 0 && (
        <PortfolioSummaryStrip
          summary={summary}
          environmentCount={environments.length}
        />
      )}
      <PortfolioFilters filters={filters} environments={environments} onChange={setFilters} />

      {isFetching && !isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {filteredApps.length === 0 ? (
        <Alert severity="info">
          {filters.search || filters.status !== 'all' || filters.environment !== 'all'
            ? 'No web apps match your filters.'
            : 'No frontend or web applications discovered yet. Deploy workloads with "frontend" or "web" in the name to populate this page.'}
        </Alert>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {filteredApps.map((app) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`${app.namespace}-${app.appKey}`}>
                <PortfolioAppTile app={app} />
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            Showing {filteredApps.length} of {webApps.length} web app{webApps.length !== 1 ? 's' : ''}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default MyApps;
