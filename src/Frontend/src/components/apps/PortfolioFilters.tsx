import React from 'react';
import {
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useIsMobile } from '../../hooks/useIsMobile';

export type SortOption = 'name-asc' | 'name-desc' | 'status';

export interface PortfolioFilterState {
  search: string;
  environment: string;
  status: string;
  sort: SortOption;
}

interface PortfolioFiltersProps {
  filters: PortfolioFilterState;
  environments: string[];
  onChange: (filters: PortfolioFilterState) => void;
}

const PortfolioFilters: React.FC<PortfolioFiltersProps> = ({ filters, environments, onChange }) => {
  const isMobile = useIsMobile();
  const set = (partial: Partial<PortfolioFilterState>) => onChange({ ...filters, ...partial });

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: isMobile ? 'stretch' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        mb: 3,
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid rgba(148, 163, 184, 0.1)',
      }}
    >
      <TextField
        size="small"
        placeholder="Search apps..."
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
        sx={{ minWidth: isMobile ? 0 : 220, flex: isMobile ? '1 1 auto' : '1 1 220px', maxWidth: isMobile ? '100%' : 360, width: isMobile ? '100%' : 'auto' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <FormControl size="small" sx={{ minWidth: isMobile ? 0 : 140, width: isMobile ? '100%' : 'auto' }}>
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
      <FormControl size="small" sx={{ minWidth: isMobile ? 0 : 120, width: isMobile ? '100%' : 'auto' }}>
        <InputLabel>Status</InputLabel>
        <Select label="Status" value={filters.status} onChange={(e) => set({ status: e.target.value })}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="Healthy">Healthy</MenuItem>
          <MenuItem value="Degraded">Degraded</MenuItem>
          <MenuItem value="Offline">Offline</MenuItem>
          <MenuItem value="Starting">Starting</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: isMobile ? 0 : 140, width: isMobile ? '100%' : 'auto' }}>
        <InputLabel>Sort by</InputLabel>
        <Select label="Sort by" value={filters.sort} onChange={(e) => set({ sort: e.target.value as SortOption })}>
          <MenuItem value="name-asc">Name A-Z</MenuItem>
          <MenuItem value="name-desc">Name Z-A</MenuItem>
          <MenuItem value="status">Status</MenuItem>
        </Select>
      </FormControl>
      <Typography variant="caption" color="text.secondary" sx={{ ml: isMobile ? 0 : 'auto' }}>
        Showing frontend &amp; web apps only
      </Typography>
    </Box>
  );
};

export default PortfolioFilters;
