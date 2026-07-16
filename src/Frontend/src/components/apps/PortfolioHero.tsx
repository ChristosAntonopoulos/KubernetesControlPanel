import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { AutoAwesome as BannerIcon } from '@mui/icons-material';
import { useIsMobile } from '../../hooks/useIsMobile';

interface PortfolioHeroProps {
  appCount: number;
  lastUpdated?: string;
}

const PortfolioHero: React.FC<PortfolioHeroProps> = ({ appCount, lastUpdated }) => {
  const isMobile = useIsMobile();

  return (
  <Box sx={{ mb: 3 }}>
    <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
      Web Apps
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mb: 2.5 }}>
      Frontends and web applications discovered in your cluster — open, monitor, and manage them from one place.
    </Typography>

    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        p: 2.5,
        borderRadius: 2,
        border: '1px solid rgba(59, 130, 246, 0.35)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(15, 23, 42, 0.6) 100%)',
        boxShadow: '0 0 32px rgba(59, 130, 246, 0.12)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BannerIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="body2" color="text.primary">
          Automatically discovers web and frontend apps with public URLs from your cluster.
        </Typography>
      </Box>
      <Chip
        label="Live from cluster"
        size="small"
        sx={{
          bgcolor: 'rgba(59, 130, 246, 0.15)',
          color: 'primary.main',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}
      />
    </Box>

    {appCount > 0 && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        {appCount} web app{appCount !== 1 ? 's' : ''}
        {lastUpdated && <> · Updated {new Date(lastUpdated).toLocaleString()}</>}
      </Typography>
    )}
  </Box>
  );
};

export default PortfolioHero;
