import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  ListSubheader,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Storage as PodsIcon,
  Computer as NodesIcon,
  Folder as NamespacesIcon,
  Apps as DeploymentsIcon,
  Web as MyAppsIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const portalItems = [
  { text: 'Apps', icon: <MyAppsIcon />, path: '/apps' },
];

const operationsItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Pods', icon: <PodsIcon />, path: '/pods' },
  { text: 'Deployments', icon: <DeploymentsIcon />, path: '/deployments' },
  { text: 'Nodes', icon: <NodesIcon />, path: '/nodes' },
  { text: 'Namespaces', icon: <NamespacesIcon />, path: '/namespaces' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isSelected = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          K8s Control Panel
        </Typography>
      </Toolbar>
      <List subheader={<ListSubheader>Portal</ListSubheader>}>
        {portalItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton selected={isSelected(item.path)} onClick={() => { navigate(item.path); setMobileOpen(false); }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List subheader={<ListSubheader>Operations</ListSubheader>}>
        {operationsItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton selected={isSelected(item.path)} onClick={() => { navigate(item.path); setMobileOpen(false); }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const isPortalPage = location.pathname.startsWith('/apps');

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <AdminIcon sx={{ mr: 1, display: { xs: 'none', sm: 'block' }, opacity: 0.8 }} />
          <Typography variant="h6" noWrap component="div" sx={{ fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
            {isPortalPage ? 'App Portfolio' : 'K8s Control Panel'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          overflowX: 'hidden',
          bgcolor: isPortalPage ? 'background.default' : undefined,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
