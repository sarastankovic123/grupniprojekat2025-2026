import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import NotificationBell from './NotificationBell';

import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'A');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0 } }}>
            {/* Mobile Menu Icon */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 'bold',
                flexGrow: { xs: 1, md: 0 },
              }}
            >
              🎵 Music Platform
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, ml: 4, alignItems: 'center', flexGrow: 1 }}>
              <Button component={RouterLink} to="/" color="primary">
                Home
              </Button>
              <Button component={RouterLink} to="/artists" color="primary">
                Artists
              </Button>
              <Button component={RouterLink} to="/genres" color="primary">
                Genres
              </Button>
              {isAdmin && (
                <Button component={RouterLink} to="/admin/artists/new" color="primary">
                  + Add Artist
                </Button>
              )}
            </Box>

            {/* Right side: notifications + auth */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <Button component={RouterLink} to="/profile">
                    Profile
                  </Button>
                  <Button onClick={logout} color="error">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button component={RouterLink} to="/register">
                    Register
                  </Button>
                  <Button component={RouterLink} to="/login" variant="contained" color="primary">
                    Login
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { md: 'none' } }}
      >
        <Box sx={{ width: 250 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              🎵 Menu
            </Typography>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/" onClick={handleDrawerToggle}>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/artists" onClick={handleDrawerToggle}>
                <ListItemText primary="Artists" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/genres" onClick={handleDrawerToggle}>
                <ListItemText primary="Genres" />
              </ListItemButton>
            </ListItem>
            {isAdmin && (
              <ListItem disablePadding>
                <ListItemButton component={RouterLink} to="/admin/artists/new" onClick={handleDrawerToggle}>
                  <ListItemText primary="+ Add Artist" />
                </ListItemButton>
              </ListItem>
            )}
            <Divider />
            {isAuthenticated ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/profile" onClick={handleDrawerToggle}>
                    <ListItemText primary="Profile" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => { logout(); handleDrawerToggle(); }}>
                    <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/register" onClick={handleDrawerToggle}>
                    <ListItemText primary="Register" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/login" onClick={handleDrawerToggle}>
                    <ListItemText primary="Login" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
