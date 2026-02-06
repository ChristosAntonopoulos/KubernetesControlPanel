import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Paper,
  Toolbar,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { podsApi } from '../services/api';
import { PodInfo, ContainerInfo, LogViewerOptions } from '../types';

interface LogViewerProps {
  open: boolean;
  onClose: () => void;
  pod: PodInfo;
  initialOptions?: Partial<LogViewerOptions>;
}

const LogViewer: React.FC<LogViewerProps> = ({ open, onClose, pod, initialOptions }) => {
  const [selectedContainer, setSelectedContainer] = useState<string>(
    initialOptions?.containerName || pod.containers[0]?.name || ''
  );
  const [tailLines, setTailLines] = useState<number>(initialOptions?.tailLines || 100);
  const [showPrevious, setShowPrevious] = useState(initialOptions?.previous || false);
  const [follow, setFollow] = useState(initialOptions?.follow || false);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logContentRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['pod-logs', pod.namespace, pod.name, selectedContainer, tailLines, showPrevious],
    queryFn: () => {
      if (showPrevious) {
        return podsApi.getPreviousLogs(pod.namespace, pod.name, selectedContainer, tailLines);
      }
      return podsApi.getLogs(pod.namespace, pod.name, selectedContainer, tailLines);
    },
    enabled: open,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  useEffect(() => {
    if (follow && logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [logs, follow]);

  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const handleContainerChange = (container: string) => {
    setSelectedContainer(container);
  };

  const handleTailLinesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (value > 0) {
      setTailLines(value);
    }
  };

  const handleDownloadLogs = () => {
    if (logs) {
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pod.name}-${selectedContainer}-logs.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark style="background-color: yellow;">$1</mark>');
  };

  const filteredLogs = logs ? 
    logs.split('\n').filter(line => 
      !searchTerm || line.toLowerCase().includes(searchTerm.toLowerCase())
    ).join('\n') : '';

  const logLines = filteredLogs.split('\n');

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Pod Logs - {pod.name}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Paper sx={{ m: 2, mb: 0 }}>
          <Toolbar variant="dense">
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" width="100%">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Container</InputLabel>
                <Select
                  value={selectedContainer}
                  label="Container"
                  onChange={(e) => handleContainerChange(e.target.value)}
                >
                  {pod.containers.map((container) => (
                    <MenuItem key={container.name} value={container.name}>
                      {container.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Tail Lines"
                type="number"
                value={tailLines}
                onChange={handleTailLinesChange}
                sx={{ width: 100 }}
                inputProps={{ min: 1, max: 10000 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={showPrevious}
                    onChange={(e) => setShowPrevious(e.target.checked)}
                    size="small"
                  />
                }
                label="Previous"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto Refresh"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={follow}
                    onChange={(e) => setFollow(e.target.checked)}
                    size="small"
                  />
                }
                label="Follow"
              />

              <Box display="flex" alignItems="center" gap={1}>
                <TextField
                  size="small"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                    endAdornment: searchTerm && (
                      <IconButton size="small" onClick={handleClearSearch}>
                        <ClearIcon />
                      </IconButton>
                    ),
                  }}
                  sx={{ minWidth: 200 }}
                />
              </Box>

              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <IconButton onClick={() => refetch()} size="small" title="Refresh">
                  <RefreshIcon />
                </IconButton>
                <IconButton onClick={handleDownloadLogs} size="small" title="Download">
                  <DownloadIcon />
                </IconButton>
              </Box>
            </Box>
          </Toolbar>
        </Paper>

        <Box sx={{ mx: 2, mb: 2 }}>
          <Box display="flex" gap={1} mb={1}>
            <Chip 
              label={`Lines: ${logLines.length}`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={showPrevious ? 'Previous Instance' : 'Current Instance'} 
              size="small" 
              color={showPrevious ? 'warning' : 'primary'}
            />
            {autoRefresh && (
              <Chip 
                label="Auto Refresh" 
                size="small" 
                color="success"
                icon={<PlayIcon />}
              />
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load logs: {error.message}
            </Alert>
          )}

          <Paper 
            ref={logContentRef}
            sx={{ 
              height: '50vh', 
              overflow: 'auto', 
              backgroundColor: 'background.default',
              fontFamily: 'monospace',
              fontSize: '12px',
              p: 1
            }}
          >
            {isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="white">Loading logs...</Typography>
              </Box>
            ) : logs ? (
              <Box>
                {logLines.map((line, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      color: line.includes('ERROR') ? '#ff6b6b' : 
                             line.includes('WARN') ? '#ffd93d' :
                             line.includes('INFO') ? '#6bcf7f' : 'white',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      lineHeight: 1.2,
                      borderLeft: line.includes('ERROR') ? '3px solid #ff6b6b' : 'none',
                      pl: line.includes('ERROR') ? 1 : 0,
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerm(line) 
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="white">No logs available</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogViewer;