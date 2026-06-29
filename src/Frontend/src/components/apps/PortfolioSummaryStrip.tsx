import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Apps as AppsIcon,
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as OfflineIcon,
  Layers as EnvIcon,
} from '@mui/icons-material';
import { AppSummaryStats } from '../../types';

interface PortfolioSummaryStripProps {
  summary: AppSummaryStats;
  environmentCount: number;
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  glow: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, glow, icon }) => (
  <Box
    sx={{
      flex: '1 1 140px',
      minWidth: 130,
      p: 2,
      borderRadius: 2,
      bgcolor: 'background.paper',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      boxShadow: `0 0 20px ${glow}`,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: `${color}22`,
        color,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  </Box>
);

const PortfolioSummaryStrip: React.FC<PortfolioSummaryStripProps> = ({ summary, environmentCount }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
    <StatCard label="Total Apps" value={summary.total} color="#3b82f6" glow="rgba(59,130,246,0.08)" icon={<AppsIcon />} />
    <StatCard label="Healthy" value={summary.healthy} color="#4ade80" glow="rgba(74,222,128,0.08)" icon={<HealthyIcon />} />
    <StatCard label="Degraded" value={summary.degraded} color="#fbbf24" glow="rgba(251,191,36,0.08)" icon={<DegradedIcon />} />
    <StatCard label="Offline" value={summary.offline} color="#f87171" glow="rgba(248,113,113,0.08)" icon={<OfflineIcon />} />
    <StatCard label="Environments" value={environmentCount} color="#a78bfa" glow="rgba(167,139,250,0.08)" icon={<EnvIcon />} />
  </Box>
);

export default PortfolioSummaryStrip;
