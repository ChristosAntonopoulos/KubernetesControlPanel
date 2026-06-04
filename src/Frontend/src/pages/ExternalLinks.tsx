import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  MenuBook,
  Insights,
  Groups,
  Link as LinkIcon,
  Description,
  Inventory,
  BarChart,
  Timeline,
  Build,
  Code,
} from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';
import { linksApi } from '../services/api';
import { ExternalLinkCategory, ExternalLinkItem } from '../types';

const iconMap: Record<string, SvgIconComponent> = {
  MenuBook,
  Insights,
  Groups,
  Link: LinkIcon,
  Description,
  Inventory,
  BarChart,
  Timeline,
  Build,
  Code,
  OpenInNew: OpenInNewIcon,
};

const resolveIcon = (name?: string): SvgIconComponent => {
  if (!name) return LinkIcon;
  return iconMap[name] ?? LinkIcon;
};

const ExternalLinks: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['external-links'],
    queryFn: linksApi.getAll,
  });

  const filteredCategories = useMemo(() => {
    if (!data?.categories) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data.categories;

    return data.categories
      .map((category) => ({
        ...category,
        links: category.links.filter(
          (link) =>
            link.title.toLowerCase().includes(term) ||
            (link.description?.toLowerCase().includes(term) ?? false) ||
            link.url.toLowerCase().includes(term) ||
            link.tags.some((tag) => tag.toLowerCase().includes(term)) ||
            category.name.toLowerCase().includes(term)
        ),
      }))
      .filter((category) => category.links.length > 0);
  }, [data, searchTerm]);

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load external links.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        External Links
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quick access to services, dashboards, and documentation outside this Kubernetes control panel.
        Links are configured in <code>appsettings.json</code> under <code>ExternalLinks</code>.
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search links, tags, or categories..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3, maxWidth: 480 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {filteredCategories.length === 0 ? (
        <Alert severity="info">No links match your search.</Alert>
      ) : (
        filteredCategories.map((category: ExternalLinkCategory) => {
          const CategoryIcon = resolveIcon(category.icon);
          return (
            <Box key={category.name} sx={{ mb: 4 }}>
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                <CategoryIcon color="primary" />
                <Typography variant="h5">{category.name}</Typography>
              </Box>
              {category.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {category.description}
                </Typography>
              )}
              <Grid container spacing={2}>
                {category.links.map((link: ExternalLinkItem) => {
                  const LinkIconComponent = resolveIcon(link.icon);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={`${category.name}-${link.title}`}>
                      <Card
                        sx={{
                          height: '100%',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardActionArea
                          component="a"
                          href={link.url}
                          target={link.openInNewTab ? '_blank' : '_self'}
                          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                          sx={{ height: '100%' }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="flex-start" gap={1.5}>
                              <LinkIconComponent color="primary" sx={{ mt: 0.25 }} />
                              <Box flex={1}>
                                <Typography variant="h6" component="div" gutterBottom>
                                  {link.title}
                                </Typography>
                                {link.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {link.description}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" noWrap display="block">
                                  {link.url}
                                </Typography>
                                {link.tags.length > 0 && (
                                  <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {link.tags.map((tag) => (
                                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                              {link.openInNewTab && <OpenInNewIcon fontSize="small" color="action" />}
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          );
        })
      )}
    </Box>
  );
};

export default ExternalLinks;
