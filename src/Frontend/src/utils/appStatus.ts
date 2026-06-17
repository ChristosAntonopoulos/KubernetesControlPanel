export type UserAppStatus = 'Healthy' | 'Degraded' | 'Offline' | 'Starting' | 'Unknown';

export const statusColor = (status: string): 'success' | 'warning' | 'error' | 'default' | 'info' => {
  const s = status.toLowerCase();
  if (s === 'healthy') return 'success';
  if (s === 'degraded') return 'warning';
  if (s === 'starting') return 'info';
  if (s === 'offline') return 'error';
  return 'default';
};

export const statusLabel = (status: string): string => {
  const s = status.toLowerCase();
  if (s === 'healthy') return 'Healthy';
  if (s === 'degraded') return 'Degraded';
  if (s === 'starting') return 'Starting';
  if (s === 'offline') return 'Offline';
  return 'Unknown';
};
