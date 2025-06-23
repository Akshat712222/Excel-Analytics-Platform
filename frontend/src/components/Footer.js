import React, { useContext, useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Paper,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import AuthContext from '../context/AuthContext';

/**
 * Footer component for the Excel Analytics Platform
 * Displays copyright information, quick links, and contact details
 * Adapts to different page layouts (auth vs non-auth pages)
 * Only appears when user scrolls to the bottom of the page
 */
const Footer = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFooter, setShowFooter] = useState(true); // Default to showing footer
  
  // Check if current page is login or register
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Function to check if user has scrolled to the bottom
  const handleScroll = () => {
    // For auth pages, we don't need to check scroll position
    if (isAuthPage) {
      setShowFooter(true);
      return;
    }
    
    // For regular pages, always show the footer
    // This makes the footer behave naturally at the end of content
    setShowFooter(true);
  };
  
  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    
    // Initial check in case page is already at bottom
    handleScroll();
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <AnimatePresence>
      {(showFooter || isAuthPage) && (
        <Box sx={{ 
          width: '100%', 
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0, // Prevent footer from shrinking
          position: isAuthPage ? 'fixed' : 'static', // Only fixed for auth pages, static for all others
          bottom: isAuthPage ? 0 : 'auto',
          left: isAuthPage ? 0 : 'auto',
          right: isAuthPage ? 0 : 'auto',
          zIndex: isAuthPage ? 100 : 1,
          height: 'auto', // Allow height to adjust based on content
          maxHeight: isAuthPage ? '50%' : 'none' // Only limit height for auth pages
        }}>
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden" // Add exit animation
          >
        <Paper 
          elevation={3} 
          sx={{ 
            p: isMobile ? 1 : 1.5, // Reduced padding by 50%
            mt: 0,
            mb: 0,
            backgroundColor: 'primary.main', 
            color: 'white',
            width: '100%',
            borderRadius: 0,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 -2px 4px -1px rgba(0, 0, 0, 0.1), 0 -1px 2px -1px rgba(0, 0, 0, 0.06)', // Reduced shadow
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <Grid container spacing={isMobile ? 1 : 1.5} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={4} sx={{ py: 0 }}>
              <Box sx={{ mb: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5, letterSpacing: 0.5, fontSize: '0.9rem' }}>
                  Excel Analytics Platform
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  © {new Date().getFullYear()} Excel Analytics. All rights reserved.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3} sx={{ py: 0 }}>
              <Box sx={{ mb: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5, letterSpacing: 0.5, fontSize: '0.9rem' }}>
                  Quick Links
                </Typography>
                <List dense sx={{ '& .MuiListItem-root': { mb: 0, py: 0 } }}>
                {isAuthenticated ? (
                  // Links for authenticated users
                  <>
                    <ListItem disablePadding>
                      <ListItemButton component={RouterLink} to="/dashboard" sx={{ p: 0, minHeight: '24px' }}>
                        <ListItemText primary="Dashboard" primaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.75rem' } }} />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton component={RouterLink} to="/files" sx={{ p: 0, minHeight: '24px' }}>
                        <ListItemText primary="Files" primaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.75rem' } }} />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton component={RouterLink} to="/charts" sx={{ p: 0, minHeight: '24px' }}>
                        <ListItemText primary="Charts" primaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.75rem' } }} />
                      </ListItemButton>
                    </ListItem>
                  </>
                ) : (
                  // Links for non-authenticated users
                  <>
                    <ListItem disablePadding>
                      <ListItemButton component={RouterLink} to="/login" sx={{ p: 0, minHeight: '24px' }}>
                        <ListItemText primary="Login" primaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.75rem' } }} />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton component={RouterLink} to="/register" sx={{ p: 0, minHeight: '24px' }}>
                        <ListItemText primary="Register" primaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.75rem' } }} />
                      </ListItemButton>
                    </ListItem>
                  </>
                )}
              </List>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ py: 0 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5, letterSpacing: 0.5, fontSize: '0.9rem' }}>
                  Connect With Us
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    color="inherit" 
                    sx={{ p: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    component="a"
                    href="https://github.com/Akshat712222"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitHubIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="inherit" 
                    sx={{ p: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    component="a"
                    href="https://www.linkedin.com/in/akshat-garg-978496249"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkedInIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                    <Typography variant="caption">akshatgarg047@gmail.com</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
    </Box>
      )}
    </AnimatePresence>
  );
};

export default Footer;