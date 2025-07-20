import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Event as EventIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { podsApi } from '../services/api';
import { PodInfo, ClusterEvent } from '../types';

interface PodDetailsProps {
  open: boolean;
  onClose: () => void;
  pod: PodInfo;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pod-details-tabpanel-${index}`}
      aria-labelledby={`pod-details-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PodDetails: React.FC<PodDetailsProps> = ({ open, onClose, pod }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const { data: podDetails, isLoading: detailsLoading, error: detailsError, refetch: refetchDetails } = useQuery({
    queryKey: ['pod-details', pod.namespace, pod.name],
    queryFn: () => podsApi.getDetails(pod.namespace, pod.name),
    enabled: open,
  });

  const { data: events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['pod-events', pod.namespace, pod.name],
    queryFn: () => podsApi.getEvents(pod.namespace, pod.name),
    enabled: open,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'error':
        return 'error';
      case 'succeeded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getEventIcon = (type: string, reason: string) => {
    if (type === 'Warning' || reason.includes('Failed') || reason.includes('Error')) {
      return <WarningIcon color="warning" />;
    }
    if (type === 'Normal' && (reason.includes('Started') || reason.includes('Created'))) {
      return <CheckCircleIcon color="success" />;
    }
    return <InfoIcon color="info" />;
  };

  const currentPod = podDetails || pod;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon />
            <Typography variant="h6">
              Pod Details - {pod.name}
            </Typography>
            <Chip 
              label={currentPod.status} 
              color={getStatusColor(currentPod.status) as any}
              size="small"
            />
          </Box>
          <Box display="flex" gap={1}>
            <IconButton onClick={() => { refetchDetails(); refetchEvents(); }} size="small">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="pod details tabs">
            <Tab label="Overview" />
            <Tab label="Containers" />
            <Tab label="Events" />
            <Tab label="Labels & Annotations" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          {/* Overview Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Basic Information</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Name</TableCell>
                        <TableCell>{currentPod.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Namespace</TableCell>
                        <TableCell>{currentPod.namespace}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Status</TableCell>
                        <TableCell>
                          <Chip 
                            label={currentPod.status} 
                            color={getStatusColor(currentPod.status) as any}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Phase</TableCell>
                        <TableCell>{currentPod.phase}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Pod IP</TableCell>
                        <TableCell>{currentPod.podIP || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Node</TableCell>
                        <TableCell>{currentPod.nodeName || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Ready</TableCell>
                        <TableCell>
                          <Chip 
                            label={currentPod.isReady ? 'Yes' : 'No'} 
                            color={currentPod.isReady ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Restart Count</TableCell>
                        <TableCell>{currentPod.restartCount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Created</TableCell>
                        <TableCell>{formatTimestamp(currentPod.creationTimestamp)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Resource Requirements</Typography>
                  {currentPod.requests || currentPod.limits ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Resource</TableCell>
                          <TableCell>Requests</TableCell>
                          <TableCell>Limits</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row">CPU</TableCell>
                          <TableCell>{currentPod.requests?.cpu || 'N/A'}</TableCell>
                          <TableCell>{currentPod.limits?.cpu || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Memory</TableCell>
                          <TableCell>{currentPod.requests?.memory || 'N/A'}</TableCell>
                          <TableCell>{currentPod.limits?.memory || 'N/A'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No resource requirements defined
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {/* Containers Tab */}
          <Typography variant="h6" mb={2}>Containers ({currentPod.containers.length})</Typography>
          <Grid container spacing={2}>
            {currentPod.containers.map((container, index) => (
              <Grid item xs={12} key={container.name}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <ContainerIcon />
                      <Typography variant="h6">{container.name}</Typography>
                      <Chip 
                        label={container.status} 
                        color={getStatusColor(container.status) as any}
                        size="small"
                      />
                      <Chip 
                        label={container.ready ? 'Ready' : 'Not Ready'} 
                        color={container.ready ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row">Image</TableCell>
                          <TableCell>{container.image}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">State</TableCell>
                          <TableCell>{container.state}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Restart Count</TableCell>
                          <TableCell>{container.restartCount}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          {/* Events Tab */}
          <Typography variant="h6" mb={2}>Recent Events</Typography>
          {eventsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load events: {eventsError.message}
            </Alert>
          )}
          {eventsLoading ? (
            <Typography>Loading events...</Typography>
          ) : events && events.length > 0 ? (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Last Seen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getEventIcon(event.type, event.reason)}
                          <Chip 
                            label={event.type} 
                            color={event.type === 'Warning' ? 'warning' : 'default'}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{event.reason}</TableCell>
                      <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                        {event.message}
                      </TableCell>
                      <TableCell>{event.source}</TableCell>
                      <TableCell>{event.count}</TableCell>
                      <TableCell>{formatTimestamp(event.lastTimestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No events found for this pod
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          {/* Labels & Annotations Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Labels</Typography>
                  {Object.keys(currentPod.labels).length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {Object.entries(currentPod.labels).map(([key, value]) => (
                        <Chip 
                          key={key}
                          label={`${key}: ${value}`}
                          variant="outlined"
                          size="small"
                          icon={<LabelIcon />}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No labels defined
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2}>Annotations</Typography>
                  {Object.keys(currentPod.annotations).length > 0 ? (
                    <List dense>
                      {Object.entries(currentPod.annotations).map(([key, value]) => (
                        <ListItem key={key} divider>
                          <ListItemText
                            primary={key}
                            secondary={value}
                            secondaryTypographyProps={{
                              sx: { wordBreak: 'break-all' }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No annotations defined
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PodDetails;