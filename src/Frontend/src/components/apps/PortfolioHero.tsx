import React from 'react';
import { Box, Typography } from '@mui/material';
import { AppSummaryStats } from '../../types';

interface PortfolioHeroProps {
  summary?: AppSummaryStats;
  lastUpdated?: string;
}

const PortfolioHero: React.FC<PortfolioHeroProps> = ({ summary, lastUpdated }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h4" gutterBottom fontWeight={700}>
      My Apps
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
      Applications discovered from the Kubernetes cluster — your internal app portfolio.
    </Typography>
    {summary && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {summary.total} app{summary.total !== 1 ? 's' : ''}
        {lastUpdated && <> · Updated {new Date(lastUpdated).toLocaleString()}</>}
      </Typography>
    )}
  </Box>
);

export default PortfolioHero;
