import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  FormHelperText
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Email as EmailIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const Profile = ({ initialSection = 'profile' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { user, logout, updateUserProfile, updateUserPreferences } = useAuth();
  
  // State for active section
  const [activeSection, setActiveSection] = useState(initialSection);
  
  // State for profile information
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || ''
  });
  
  // State for notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: user?.preferences?.notifications?.emailNotifications ?? true,
    appNotifications: user?.preferences?.notifications?.appNotifications ?? true,
    reportUpdates: user?.preferences?.notifications?.reportUpdates ?? true,
    securityAlerts: user?.preferences?.notifications?.securityAlerts ?? true
  });
  
  // State for account settings
  const [settings, setSettings] = useState({
    twoFactorAuth: user?.preferences?.settings?.twoFactorAuth ?? false,
    dataSharing: user?.preferences?.settings?.dataSharing ?? true,
    darkModeDefault: user?.preferences?.settings?.darkModeDefault ?? false
  });
  
  // State for help dialog
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedHelpTopic, setSelectedHelpTopic] = useState(null);
  
  // State for form validation and submission
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Read section from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    if (sectionParam && ['profile', 'notifications', 'settings', 'help'].includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [location.search]);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || ''
      });
      
      setNotifications({
        emailNotifications: user?.preferences?.notifications?.emailNotifications ?? true,
        appNotifications: user?.preferences?.notifications?.appNotifications ?? true,
        reportUpdates: user?.preferences?.notifications?.reportUpdates ?? true,
        securityAlerts: user?.preferences?.notifications?.securityAlerts ?? true
      });
      
      setSettings({
        twoFactorAuth: user?.preferences?.settings?.twoFactorAuth ?? false,
        dataSharing: user?.preferences?.settings?.dataSharing ?? true,
        darkModeDefault: user?.preferences?.settings?.darkModeDefault ?? false
      });
    }
  }, [user]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    // newValue is the tab index (0, 1, 2, 3), convert it to section name
    const sections = ['profile', 'notifications', 'settings', 'help'];
    setActiveSection(sections[newValue]);
  };
  
  // Handle profile data change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate profile data
  const validateProfileData = () => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (profileData.phone && !/^[\d\s\-\+\(\)]+$/.test(profileData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle profile save
  const handleProfileSave = async () => {
    if (!validateProfileData()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await updateUserProfile(user.id, profileData);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to update profile',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred while updating profile',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle notification preference change
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle notification preferences save
  const handleNotificationSave = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await updateUserPreferences(user.id, {
        notifications
      });
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Notification preferences saved successfully!',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to save notification preferences',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred while saving notification preferences',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle settings change
  const handleSettingChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle settings save
  const handleSettingsSave = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await updateUserPreferences(user.id, {
        settings
      });
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Account settings saved successfully!',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to save account settings',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred while saving account settings',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle help topic selection
  const handleHelpTopicSelect = (topic) => {
    setSelectedHelpTopic(topic);
    setHelpDialogOpen(true);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Map section to tab index
  const getTabValue = () => {
    switch(activeSection) {
      case 'profile': return 0;
      case 'notifications': return 1;
      case 'settings': return 2;
      case 'help': return 3;
      default: return 0;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: isMobile ? 2 : 3 }}>
      <Paper elevation={3} sx={{ p: isMobile ? 2 : 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontSize: isMobile ? '1.75rem' : '2.125rem' }}>
          My Profile
        </Typography>
        
        <Tabs 
          value={getTabValue()} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{ 
            mb: 4, 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              minWidth: isMobile ? 'auto' : 90,
              padding: isMobile ? '6px 12px' : '12px 16px',
            }
          }}
        >
          <Tab 
            icon={<PersonIcon />} 
            label={isMobile ? "Profile" : "Profile Information"} 
            value={0} 
            iconPosition={isMobile ? "top" : "start"}
            component={Link}
            to="/profile?section=profile"
          />
          <Tab 
            icon={<NotificationsIcon />} 
            label={isMobile ? "Notifications" : "Notification Preferences"} 
            value={1} 
            iconPosition={isMobile ? "top" : "start"}
            component={Link}
            to="/profile?section=notifications"
          />
          <Tab 
            icon={<SettingsIcon />} 
            label={isMobile ? "Settings" : "Account Settings"} 
            value={2} 
            iconPosition={isMobile ? "top" : "start"}
            component={Link}
            to="/profile?section=settings"
          />
          <Tab 
            icon={<HelpIcon />} 
            label={isMobile ? "Help" : "Help & Support"} 
            value={3} 
            iconPosition={isMobile ? "top" : "start"}
            component={Link}
            to="/profile?section=help"
          />
        </Tabs>
        
        {/* Profile Information Section */}
        {activeSection === 'profile' && (
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center', mb: isMobile ? 3 : 0 }}>
              <Avatar 
                sx={{ 
                  width: isMobile ? 100 : 120, 
                  height: isMobile ? 100 : 120, 
                  fontSize: isMobile ? '2.5rem' : '3rem',
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main'
                }}
              >
                {profileData.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                {profileData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {new Date().toLocaleDateString()}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    variant="outlined"
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    variant="outlined"
                    margin="normal"
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    variant="outlined"
                    margin="normal"
                    error={!!errors.phone}
                    helperText={errors.phone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sx={{ mt: 2, textAlign: 'right' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleProfileSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
        
        {/* Notification Preferences Section */}
        {activeSection === 'notifications' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
              Manage how you receive notifications and updates from the Excel Analytics Platform.
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Email Notifications" 
                  secondary="Receive important updates via email"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notifications.emailNotifications} 
                      onChange={handleNotificationChange} 
                      name="emailNotifications" 
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="App Notifications" 
                  secondary="Receive notifications within the application"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notifications.appNotifications} 
                      onChange={handleNotificationChange} 
                      name="appNotifications" 
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Report Updates" 
                  secondary="Get notified when reports are updated or new data is available"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notifications.reportUpdates} 
                      onChange={handleNotificationChange} 
                      name="reportUpdates" 
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Security Alerts" 
                  secondary="Receive notifications about security-related events"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={notifications.securityAlerts} 
                      onChange={handleNotificationChange} 
                      name="securityAlerts" 
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleNotificationSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Preferences'}
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Account Settings Section */}
        {activeSection === 'settings' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Account Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
              Manage your account settings and preferences.
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Two-Factor Authentication" 
                  secondary="Add an extra layer of security to your account"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.twoFactorAuth} 
                      onChange={handleSettingChange} 
                      name="twoFactorAuth" 
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Data Sharing" 
                  secondary="Allow anonymous usage data to be shared for platform improvements"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.dataSharing} 
                      onChange={handleSettingChange} 
                      name="dataSharing" 
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Dark Mode Default" 
                  secondary="Set dark mode as the default theme"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.darkModeDefault} 
                      onChange={handleSettingChange} 
                      name="darkModeDefault" 
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                Account Actions
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 1 : 2
              }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth={isMobile}
                  onClick={() => alert('Password reset email sent!')}
                >
                  Change Password
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth={isMobile}
                  onClick={() => alert('This would deactivate your account')}
                >
                  Deactivate Account
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3, textAlign: 'right' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSettingsSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Help & Support Section */}
        {activeSection === 'help' && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Help & Support
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
              Get help with using the Excel Analytics Platform.
            </Typography>
            
            <List>
              <ListItem button onClick={() => handleHelpTopicSelect('getting-started')}>
                <ListItemIcon>
                  <HelpIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Getting Started Guide" 
                  secondary="Learn the basics of using the platform"
                />
              </ListItem>
              <Divider />
              
              <ListItem button onClick={() => handleHelpTopicSelect('file-upload')}>
                <ListItemIcon>
                  <HelpIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="File Upload Help" 
                  secondary="Learn how to upload and manage Excel files"
                />
              </ListItem>
              <Divider />
              
              <ListItem button onClick={() => handleHelpTopicSelect('chart-creation')}>
                <ListItemIcon>
                  <HelpIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Chart Creation Guide" 
                  secondary="Learn how to create and customize charts"
                />
              </ListItem>
              <Divider />
              
              <ListItem button onClick={() => handleHelpTopicSelect('contact-support')}>
                <ListItemIcon>
                  <HelpIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Contact Support" 
                  secondary="Get in touch with our support team"
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Frequently Asked Questions
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                How do I upload an Excel file?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Navigate to the Files section and click the Upload button. Select your Excel file and click Upload.
              </Typography>
              
              <Typography variant="subtitle2">
                How do I create a chart?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Go to the Charts section, click Create Chart, select your data source, and follow the chart creation wizard.
              </Typography>
              
              <Typography variant="subtitle2">
                Can I export my charts?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Yes, you can export charts as images or PDF files by clicking the Export button on any chart.
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Help Topic Dialog */}
      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)}>
        <DialogTitle>
          {selectedHelpTopic === 'getting-started' && "Getting Started Guide"}
          {selectedHelpTopic === 'file-upload' && "File Upload Help"}
          {selectedHelpTopic === 'chart-creation' && "Chart Creation Guide"}
          {selectedHelpTopic === 'contact-support' && "Contact Support"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedHelpTopic === 'getting-started' && (
              "The Excel Analytics Platform allows you to upload Excel files, analyze data, and create interactive charts. This guide will help you get started with the platform."
            )}
            {selectedHelpTopic === 'file-upload' && (
              "To upload an Excel file, navigate to the Files section and click the Upload button. Select your Excel file from your computer and click Upload. The platform supports .xlsx and .csv files."
            )}
            {selectedHelpTopic === 'chart-creation' && (
              "To create a chart, go to the Charts section and click Create Chart. Select your data source, choose a chart type, and customize your chart using the available options."
            )}
            {selectedHelpTopic === 'contact-support' && (
              "If you need assistance, please contact our support team at support@excelanalytics.com or call us at 1-800-EXCEL-HELP."
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;