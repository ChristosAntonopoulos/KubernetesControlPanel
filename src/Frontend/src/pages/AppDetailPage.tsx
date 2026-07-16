import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandIcon,
  OpenInNew as OpenIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { appsApi } from '../services/api';
import { getInitials, isEmojiOrUrl, formatRelativeTime } from '../utils/appPresentation';
import { statusColor, statusLabel } from '../utils/appStatus';
import { useIsMobile } from '../hooks/useIsMobile';

const AppDetailPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { namespace, appKey } = useParams<{ namespace: string; appKey: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: app, isLoading, error } = useQuery({
    queryKey: ['app', namespace, appKey],
    queryFn: () => appsApi.getDetail(namespace!, appKey!),
    enabled: Boolean(namespace && appKey),
  });

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <LinearProgress />;
  if (error || !app) return <Alert severity="error">App not found.</Alert>;

  const openUrl = app.primaryUrl ?? app.urls[0]?.url;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/apps')} sx={{ mb: 2 }}>
        Back to My Apps
      </Button>

      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems={isMobile ? 'flex-start' : 'flex-start'}>
            <Box
              sx={{
                width: isMobile ? 56 : 72,
                height: isMobile ? 56 : 72,
                borderRadius: 2,
                bgcolor: app.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 28,
                flexShrink: 0,
              }}
            >
              {app.icon?.startsWith('http') ? (
                <Box component="img" src={app.icon} alt="" sx={{ width: 48, height: 48 }} />
              ) : app.icon && isEmojiOrUrl(app.icon) ? (
                app.icon
              ) : (
                getInitials(app.displayName)
              )}
            </Box>
            <Box flex={1} minWidth={0}>
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} gutterBottom sx={{ wordBreak: 'break-word' }}>
                {app.displayName}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                <Chip label={statusLabel(app.userStatus)} color={statusColor(app.userStatus)} />
                {app.environment && <Chip label={app.environment} variant="outlined" />}
                {app.tags.map((t) => (
                  <Chip key={t} label={t} size="small" variant="outlined" />
                ))}
              </Stack>
              {app.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {app.description}
                </Typography>
              )}
              {(app.owner || app.lastChange) && (
                <Typography variant="body2" color="text.disabled">
                  {app.owner && <>Owner: {app.owner}</>}
                  {app.owner && app.lastChange && ' · '}
                  {app.lastChange && <>Last change {formatRelativeTime(app.lastChange)}</>}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction={isMobile ? 'column' : 'row'} spacing={1} flexWrap="wrap" sx={{ mt: 3 }}>
            {openUrl && (
              <Button
                variant="contained"
                component="a"
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenIcon />}
                fullWidth={isMobile}
              >
                Open App
              </Button>
            )}
            {openUrl && (
              <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
                <Button startIcon={<CopyIcon />} onClick={() => copyUrl(openUrl)} fullWidth={isMobile}>
                  Copy URL
                </Button>
              </Tooltip>
            )}
            <Button
              component={RouterLink}
              to={`/admin/apps/${encodeURIComponent(app.namespace)}/${encodeURIComponent(app.appKey)}`}
              startIcon={<AdminIcon />}
              variant="outlined"
              fullWidth={isMobile}
            >
              Admin View
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {app.urls.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Open links
          </Typography>
          <Grid container spacing={2}>
            {app.urls.map((link) => (
              <Grid item xs={12} sm={6} key={link.url}>
                <Card variant="outlined">
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Box minWidth={0} flex={1}>
                      <Typography fontWeight={600}>{link.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block' }}>
                        {link.url}
                      </Typography>
                    </Box>
                    <IconButton component="a" href={link.url} target="_blank" rel="noopener noreferrer">
                      <OpenIcon />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {app.components.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Components
          </Typography>
          <Stack spacing={1}>
            {app.components.map((c) => (
              <Card key={c.name} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>{c.name}</Typography>
                    <Chip label={statusLabel(c.userStatus)} size="small" color={statusColor(c.userStatus)} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {app.availabilitySummary && (
        <Alert severity={app.userStatus === 'Healthy' ? 'success' : 'warning'} sx={{ mb: 3 }}>
          {app.availabilitySummary}
        </Alert>
      )}

      <Accordion>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Typography color="text.secondary">Technical details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary">
            Namespace: {app.namespace}
            <br />
            App key: {app.appKey}
            <br />
            Components: {app.readyComponents}/{app.totalComponents} ready
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default AppDetailPage;
