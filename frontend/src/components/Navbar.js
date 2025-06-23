import React, { useContext, useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  SpaceDashboard as DashboardIcon,
  PersonOutlineRounded as PersonIcon,
  LogoutRounded as LogoutIcon,
  DarkModeRounded as DarkModeIcon,
  LightModeRounded as LightModeIcon,
  CloudUploadRounded as UploadIcon,
  AccountCircleRounded,
  InsertChartRounded as BarChartIcon,
  NotificationsNoneRounded as NotificationsIcon,
  SettingsOutlined as SettingsIcon,
  HelpOutlineRounded as HelpIcon,
  AdminPanelSettingsRounded as AdminIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import AuthContext from '../context/AuthContext';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile?section=profile');
  };

  const handleAdminDashboard = () => {
    handleClose();
    navigate('/admin');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Navigation items for both desktop and mobile
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Files', icon: <UploadIcon />, path: '/files' },
    { text: 'Charts', icon: <BarChartIcon />, path: '/charts' },
  ];

  // Mobile drawer content
  const mobileDrawerContent = (
    <Box sx={{ width: 250, pt: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Menu
        </Typography>
        <IconButton onClick={toggleMobileMenu}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => handleMobileNavigation(item.path)}
            sx={{
              backgroundColor: location.pathname === item.path ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              borderLeft: location.pathname === item.path ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      {isAdmin && (
        <ListItem button onClick={() => handleMobileNavigation('/admin')}>
          <ListItemIcon>
            <AdminIcon />
          </ListItemIcon>
          <ListItemText primary="Admin Dashboard" />
        </ListItem>
      )}
      <ListItem button onClick={() => handleMobileNavigation('/profile?section=profile')}>
        <ListItemIcon>
          <PersonIcon />
        </ListItemIcon>
        <ListItemText primary="Profile" />
      </ListItem>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <ListItem button onClick={handleLogout} sx={{ mt: 'auto' }}>
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItem>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to={isAuthenticated ? '/dashboard' : '/'}
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 'bold',
              fontSize: { xs: '1rem', sm: '1.25rem' } // Responsive font size
            }}
          >
            Excel Analytics Platform
          </Typography>

          <IconButton onClick={toggleDarkMode} color="inherit" sx={{ mr: 1 }}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {isAuthenticated ? (
            <>
              {/* Desktop Navigation */}
              {!isMobile && navItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{ 
                    mr: item.text === 'Charts' ? 2 : 1, // Add more margin to the last item
                    borderRadius: '8px',
                    padding: '6px 12px',
                    transition: 'all 0.2s ease',
                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    boxShadow: location.pathname === item.path ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    fontWeight: location.pathname === item.path ? '600' : '400',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
              
              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton 
                  edge="start" 
                  color="inherit" 
                  aria-label="menu"
                  onClick={toggleMobileMenu}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              
              {/* Mobile Navigation Drawer */}
              <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={toggleMobileMenu}
              >
                {mobileDrawerContent}
              </Drawer>
              {/* Removed greeting text as requested */}
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
                sx={{ 
                  p: 0.5,
                  border: '2px solid',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { 
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'secondary.main',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    width: 280,
                    overflow: 'visible',
                    mt: 1.5,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
              >
                {/* User Info Card */}
                <Box sx={{ p: 2, pb: 1.5, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Avatar 
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      mx: 'auto',
                      mb: 1,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: '3px solid',
                      borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {user?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
                  </Typography>
                </Box>
                
                {/* Menu Options */}
                <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
                  <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  Profile Information
                </MenuItem>
                
                <MenuItem onClick={() => { handleClose(); navigate('/profile?section=notifications'); }} sx={{ py: 1.5 }}>
                  <Box component="span" sx={{ mr: 2, display: 'flex' }}>
                    <NotificationsIcon sx={{ color: 'text.secondary' }} />
                  </Box>
                  Notification Preferences
                </MenuItem>
                
                <MenuItem onClick={() => { handleClose(); navigate('/profile?section=settings'); }} sx={{ py: 1.5 }}>
                  <SettingsIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  Account Settings
                </MenuItem>
                
                <MenuItem onClick={() => { handleClose(); navigate('/profile?section=help'); }} sx={{ py: 1.5 }}>
                  <Box component="span" sx={{ mr: 2, display: 'flex' }}>
                    <HelpIcon sx={{ color: 'text.secondary' }} />
                  </Box>
                  Help & Support
                </MenuItem>
                
                {isAdmin && (
                  <MenuItem onClick={handleAdminDashboard} sx={{ py: 1.5 }}>
                    <AdminIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    Admin Dashboard
                  </MenuItem>
                )}
                
                <Divider />
                
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                  <LogoutIcon sx={{ mr: 2, color: 'error.main' }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;