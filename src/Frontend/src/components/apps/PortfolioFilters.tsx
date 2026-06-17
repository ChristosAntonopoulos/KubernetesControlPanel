import React from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export interface PortfolioFilterState {
  search: string;
  environment: string;
  status: string;
  hasLink: boolean;
  hideSystem: boolean;
}

interface PortfolioFiltersProps {
  filters: PortfolioFilterState;
  environments: string[];
  onChange: (filters: PortfolioFilterState) => void;
}

const PortfolioFilters: React.FC<PortfolioFiltersProps> = ({ filters, environments, onChange }) => {
  const set = (partial: Partial<PortfolioFilterState>) => onChange({ ...filters, ...partial });

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
        mb: 3,
        p: 2,
        borderRadius: 2,
        bgcolor: 'action.hover',
      }}
    >
      <TextField
        size="small"
        placeholder="Search apps..."
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
        sx={{ minWidth: 220, flex: '1 1 220px', maxWidth: 360 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Environment</InputLabel>
        <Select
          label="Environment"
          value={filters.environment}
          onChange={(e) => set({ environment: e.target.value })}
        >
          <MenuItem value="all">All</MenuItem>
          {environments.map((env) => (
            <MenuItem key={env} value={env}>{env}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select label="Status" value={filters.status} onChange={(e) => set({ status: e.target.value })}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="Healthy">Healthy</MenuItem>
          <MenuItem value="Degraded">Degraded</MenuItem>
          <MenuItem value="Offline">Offline</MenuItem>
          <MenuItem value="Starting">Starting</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Switch
            checked={filters.hasLink}
            onChange={(e) => set({ hasLink: e.target.checked })}
            size="small"
          />
        }
        label={<Typography variant="body2">Has link</Typography>}
      />
      <FormControlLabel
        control={
          <Switch
            checked={filters.hideSystem}
            onChange={(e) => set({ hideSystem: e.target.checked })}
            size="small"
          />
        }
        label={<Typography variant="body2">Hide system</Typography>}
      />
    </Box>
  );
};

export default PortfolioFilters;
