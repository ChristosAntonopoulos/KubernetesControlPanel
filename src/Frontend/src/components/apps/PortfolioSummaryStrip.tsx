import React from 'react';
import { Chip, Stack } from '@mui/material';
import { AppSummaryStats } from '../../types';

interface PortfolioSummaryStripProps {
  summary: AppSummaryStats;
}

const PortfolioSummaryStrip: React.FC<PortfolioSummaryStripProps> = ({ summary }) => (
  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
    <Chip label={`${summary.total} total`} variant="outlined" size="small" />
    <Chip label={`${summary.healthy} healthy`} color="success" variant="outlined" size="small" />
    {summary.degraded > 0 && (
      <Chip label={`${summary.degraded} degraded`} color="warning" variant="outlined" size="small" />
    )}
    {summary.offline > 0 && (
      <Chip label={`${summary.offline} offline`} color="error" variant="outlined" size="small" />
    )}
    {summary.starting > 0 && (
      <Chip label={`${summary.starting} starting`} color="info" variant="outlined" size="small" />
    )}
  </Stack>
);

export default PortfolioSummaryStrip;
