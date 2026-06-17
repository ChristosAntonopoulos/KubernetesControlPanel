import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { OpenInNew as OpenIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DiscoveredApp } from '../../types';
import { formatRelativeTime, getInitials, isEmojiOrUrl } from '../../utils/appPresentation';
import { statusColor, statusLabel } from '../../utils/appStatus';

interface PortfolioAppTileProps {
  app: DiscoveredApp;
}

const PortfolioAppTile: React.FC<PortfolioAppTileProps> = ({ app }) => {
  const navigate = useNavigate();
  const hasUrl = Boolean(app.primaryUrl || app.urls.length > 0);
  const openUrl = app.primaryUrl ?? app.urls[0]?.url;

  const goToDetail = () => navigate(`/apps/${encodeURIComponent(app.namespace)}/${encodeURIComponent(app.appKey)}`);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
      }}
      onClick={goToDetail}
    >
      <CardContent sx={{ flexGrow: 1, pt: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: app.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: app.icon && isEmojiOrUrl(app.icon) && !app.icon.startsWith('http') ? 24 : 16,
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {app.icon?.startsWith('http') ? (
              <Box component="img" src={app.icon} alt="" sx={{ width: 32, height: 32, objectFit: 'contain' }} />
            ) : app.icon && isEmojiOrUrl(app.icon) ? (
              app.icon
            ) : (
              getInitials(app.displayName)
            )}
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography variant="h6" noWrap fontWeight={600}>
              {app.displayName}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
              <Chip label={statusLabel(app.userStatus)} size="small" color={statusColor(app.userStatus)} />
              {app.environment && (
                <Chip label={app.environment} size="small" variant="outlined" />
              )}
            </Stack>
          </Box>
        </Stack>

        {app.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 40,
            }}
          >
            {app.description}
          </Typography>
        )}

        {app.tags.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
            {app.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 22 }} />
            ))}
          </Stack>
        )}

        {(app.owner || app.lastChange) && (
          <Typography variant="caption" color="text.disabled">
            {app.owner && <>{app.owner}</>}
            {app.owner && app.lastChange && ' · '}
            {app.lastChange && <>updated {formatRelativeTime(app.lastChange)}</>}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }} onClick={(e) => e.stopPropagation()}>
        {hasUrl && openUrl ? (
          <Button
            variant="contained"
            size="small"
            component="a"
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenIcon />}
            onClick={(e) => e.stopPropagation()}
          >
            Open App
          </Button>
        ) : (
          <Tooltip title="No public URL available for this app">
            <span>
              <Button variant="outlined" size="small" disabled>
                Open App
              </Button>
            </span>
          </Tooltip>
        )}
        <Button size="small" onClick={goToDetail}>
          Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default PortfolioAppTile;
