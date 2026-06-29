import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  OpenInNew as OpenIcon,
  ArrowForward as DetailsIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DiscoveredApp } from '../../types';
import {
  formatRelativeTime,
  getAppDisplayName,
  getAppIconUrl,
  getInitials,
  isEmojiOrUrl,
} from '../../utils/appPresentation';
import { statusColor, statusLabel } from '../../utils/appStatus';

interface PortfolioAppTileProps {
  app: DiscoveredApp;
}

const PortfolioAppTile: React.FC<PortfolioAppTileProps> = ({ app }) => {
  const navigate = useNavigate();
  const [iconFailed, setIconFailed] = useState(false);
  const hasUrl = Boolean(app.primaryUrl || app.urls.length > 0);
  const openUrl = app.primaryUrl ?? app.urls[0]?.url;
  const displayName = getAppDisplayName(app);
  const iconUrl = getAppIconUrl(app);

  const goToDetail = () =>
    navigate(`/apps/${encodeURIComponent(app.namespace)}/${encodeURIComponent(app.appKey)}`);

  const envColor =
    app.environment?.toLowerCase() === 'production'
      ? '#3b82f6'
      : app.environment?.toLowerCase() === 'staging'
        ? '#a78bfa'
        : '#64748b';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: 'rgba(59, 130, 246, 0.35)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 24px ${app.accentColor}22`,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pt: 2.5, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" flex={1} minWidth={0}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: iconUrl && !iconFailed ? 'rgba(255,255,255,0.06)' : app.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: app.icon && isEmojiOrUrl(app.icon) && !app.icon.startsWith('http') ? 24 : 14,
                flexShrink: 0,
                overflow: 'hidden',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                boxShadow: `0 0 16px ${app.accentColor}33`,
              }}
            >
              {iconUrl && !iconFailed ? (
                <Box
                  component="img"
                  src={iconUrl}
                  alt=""
                  onError={() => setIconFailed(true)}
                  sx={{ width: 32, height: 32, objectFit: 'contain' }}
                />
              ) : app.icon && isEmojiOrUrl(app.icon) && !app.icon.startsWith('http') ? (
                app.icon
              ) : (
                getInitials(displayName)
              )}
            </Box>
            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle1" noWrap fontWeight={700}>
                {displayName}
              </Typography>
              {openUrl && (
                <Link
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.75rem',
                    color: 'primary.main',
                    maxWidth: '100%',
                  }}
                >
                  <Typography component="span" variant="caption" noWrap>
                    {openUrl.replace(/^https?:\/\//, '')}
                  </Typography>
                  <OpenIcon sx={{ fontSize: 12, flexShrink: 0 }} />
                </Link>
              )}
            </Box>
          </Stack>
          <IconButton size="small" sx={{ mt: -0.5, mr: -0.5 }} onClick={goToDetail}>
            <MoreIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
          <Chip label={statusLabel(app.userStatus)} size="small" color={statusColor(app.userStatus)} />
          {app.environment && (
            <Chip
              label={app.environment}
              size="small"
              variant="outlined"
              sx={{ borderColor: `${envColor}55`, color: envColor }}
            />
          )}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Last checked: {formatRelativeTime(app.lastChange) || 'just now'}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
        {hasUrl && openUrl ? (
          <Button
            variant="contained"
            size="small"
            component="a"
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenIcon />}
            sx={{ flex: 1, boxShadow: '0 0 16px rgba(59,130,246,0.25)' }}
          >
            Open App
          </Button>
        ) : (
          <Tooltip title="No public URL available">
            <span style={{ flex: 1 }}>
              <Button variant="contained" size="small" disabled fullWidth>
                Open App
              </Button>
            </span>
          </Tooltip>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={goToDetail}
          endIcon={<DetailsIcon />}
          sx={{ flex: 1, borderColor: 'rgba(148,163,184,0.2)' }}
        >
          Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default PortfolioAppTile;
