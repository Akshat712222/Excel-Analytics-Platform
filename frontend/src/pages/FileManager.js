import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
  Fade,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CloudDownload as CloudDownloadIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Upload as UploadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { getStatusColor, getFileIconColor } from '../utils/fileUtils';
import AuthContext from '../context/AuthContext';
import FileUpload from '../components/FileUpload';
import ResponsiveDataView from '../components/common/ResponsiveDataView';
import { responsiveStyles, useResponsiveBreakpoints } from '../utils/responsiveUtils';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Responsive breakpoints
  const { isMobile, isTablet, isDesktop } = useResponsiveBreakpoints();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch files from the server with retry functionality
  const fetchFiles = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await api.get('/api/uploads');
      setFiles(response.data);
      setFilteredFiles(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching files:', err);
      
      // Implement retry logic (max 3 retries)
      if (retryCount < 3) {
        setError(`Attempting to reconnect... (${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchFiles(retryCount + 1);
        }, 2000); // Wait 2 seconds before retrying
      } else {
        // After max retries, show a more helpful error message
        const errorMessage = err.response?.data?.message || 
                            (err.message === 'Network Error' ? 
                              'Network connection issue. Please check your internet connection.' : 
                              'Failed to load files. Please try refreshing the page.');
        setError(errorMessage);
        setLoading(false);
      }
    }
  };

  // Filter files based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFiles(files);
      return;
    }
    
    const filtered = files.filter(file => 
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredFiles(filtered);
  }, [searchTerm, files]);

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle successful upload
  const handleUploadSuccess = (data) => {
    setUploadSuccess(`File "${data.file.name}" uploaded successfully!`);
    fetchFiles(); // Refresh the file list
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
  };

  // Handle file deletion
  const handleDeleteFile = async (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.delete(`/api/uploads/${id}`);
        setFiles(files.filter(file => file._id !== id));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  // Handle view file details
  const handleViewFile = (id) => {
    navigate(`/files/${id}`);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchFiles();
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Render loading state
  if (loading && files.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CircularProgress size={60} thickness={4} />
        </motion.div>
      </Box>
    );
  }
  
  // Render error state if there's an error and no files loaded
  if (error && files.length === 0) {
    return (
      <Container maxWidth="lg" className="mt-8">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Alert 
            severity="error" 
            className="shadow-md"
            action={
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={() => fetchFiles()}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
            If the problem persists, please check your network connection or contact support.
          </Typography>
        </motion.div>
      </Container>
    );
  }

  // Use common styles from responsiveUtils
  const isDarkMode = theme.palette.mode === 'dark';
  const { responsiveStyles } = require('../utils/responsiveUtils');
  
  // Common styles for components
  const styles = {
    gradientBackground: responsiveStyles.gradientBackground(theme, isDarkMode),
    contentContainer: {
      mx: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%'
    },
    paperCard: responsiveStyles.paperCard(theme, isDarkMode)
  };

  // If loading and no files, show loading state
  if (loading && files.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '70vh' 
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CircularProgress size={60} thickness={4} />
        </motion.div>
      </Box>
    );
  }

  return (
    <Box 
      component={motion.div}
      sx={{
        py: { xs: 2, sm: 3, md: 3 },
        px: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
        height: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.1) 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4ecfb 100%)',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Container maxWidth="xl" sx={{ 
        width: '100%', 
        maxWidth: '100%', 
        px: { xs: 1, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Page Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: { xs: 2, sm: 2.5 },
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                bgcolor: isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)', 
                p: 1.5, 
                borderRadius: '12px',
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <InsertDriveFileIcon 
                  sx={{ 
                    fontSize: { xs: 28, sm: 32, md: 36 }, 
                    color: theme.palette.primary.main 
                  }} 
                />
              </Box>
              <Box>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  component="h1" 
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
                  }}
                >
                  File Manager
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  Upload and manage your Excel files
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'medium',
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  display: { xs: 'none', sm: 'flex' }
                }}
              >
                Refresh
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<UploadIcon />}
                onClick={() => document.getElementById('file-upload-section').scrollIntoView({ behavior: 'smooth' })}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'medium',
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  boxShadow: isDarkMode 
                    ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                    : '0 4px 8px rgba(33, 150, 243, 0.2)',
                  '&:hover': {
                    boxShadow: isDarkMode 
                      ? '0 6px 12px rgba(0, 0, 0, 0.5)' 
                      : '0 6px 12px rgba(33, 150, 243, 0.3)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  },
                  flex: { xs: 1, sm: 'none' }
                }}
              >
                Upload New File
              </Button>
            </Box>
          </Box>
        </motion.div>
        
        {/* Alerts */}
        <motion.div variants={itemVariants}>
          <Box sx={{ minHeight: '40px', mb: 2 }}>
            {uploadSuccess && (
              <Fade in={!!uploadSuccess}>
                <Alert 
                  severity="success" 
                  sx={{ 
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {uploadSuccess}
                </Alert>
              </Fade>
            )}
            
            {error && (
              <Fade in={!!error}>
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}
          </Box>
        </motion.div>
        
        {/* Main Content - Side by Side Layout */}
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ 
          width: '100%', 
          mx: 0, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          height: { xs: 'auto', md: 'calc(100vh - 160px)' },
          minHeight: { xs: 'auto', md: '500px' },
          maxHeight: { xs: 'none', md: '85vh' },
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Left Column - Upload Section */}
          <Grid item xs={12} md={4} lg={3.5} sx={{ 
            display: 'flex',
            flexDirection: 'column',
            mb: { xs: 3, md: 0 },
            height: { xs: 'auto', md: '100%' },
            minWidth: { md: '320px' }
          }}>
            <motion.div variants={itemVariants} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Paper 
                elevation={0} 
                id="file-upload-section"
                sx={{ 
                  borderRadius: '16px',
                  overflow: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isDarkMode 
                    ? '0 6px 24px rgba(0, 0, 0, 0.25)' 
                    : '0 6px 24px rgba(33, 150, 243, 0.12)',
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  width: '100%'
                }}
              >
                <Box sx={{ 
                  p: { xs: 2, md: 2.5 }, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(33, 150, 243, 0.02)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UploadIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Upload New File
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  p: { xs: 1.5, sm: 2, md: 2 }, 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  minHeight: { xs: '250px', sm: '280px', md: '300px' }
                }}>
                  <FileUpload onUploadSuccess={handleUploadSuccess} />
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          {/* Right Column - Files List */}
          <Grid item xs={12} md={8} lg={8.5} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: { xs: 'auto', md: '100%' },
            flex: { md: 1 },
            overflow: 'hidden',
            minHeight: { xs: '500px', md: '0' }
          }}>
            <motion.div variants={itemVariants} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  borderRadius: '16px',
                  overflow: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isDarkMode 
                    ? '0 6px 24px rgba(0, 0, 0, 0.25)' 
                    : '0 6px 24px rgba(33, 150, 243, 0.12)',
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  width: '100%',
                  maxHeight: '100%'
                }}
              >
                <Box sx={{ 
                  p: { xs: 2, md: 2.5 }, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(33, 150, 243, 0.02)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
                      Your Files
                    </Typography>
                    <Chip 
                      label={`${files.length} file${files.length !== 1 ? 's' : ''}`} 
                      color="primary" 
                      size="small" 
                      sx={{ borderRadius: '8px' }} 
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      component="form"
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderRadius: '8px',
                        px: 1.5,
                        height: '36px',
                        width: { xs: '120px', sm: '200px' }
                      }}
                    >
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', mr: 1 }} />
                      <input 
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          color: isDarkMode ? 'white' : 'inherit',
                          width: '100%',
                          fontSize: '0.875rem'
                        }}
                      />
                      {searchTerm && (
                        <IconButton 
                          size="small" 
                          onClick={handleClearSearch}
                          sx={{ p: 0.5 }}
                        >
                          <ClearIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                        </IconButton>
                      )}
                    </Box>
                    
                    <IconButton 
                      size="small"
                      onClick={handleRefresh}
                      sx={{ 
                        display: { xs: 'flex', sm: 'none' },
                        color: theme.palette.primary.main
                      }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Content container with proper scrolling behavior */}
                <Box sx={{ 
                  minHeight: { xs: '300px', md: '0' }, 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center',
                  width: '100%',
                  flex: 1,
                  overflow: 'auto',
                  maxHeight: { xs: '65vh', sm: '70vh', md: 'calc(100vh - 200px)' },
                  ...responsiveStyles.scrollbarStyles
                }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                      <CircularProgress />
                    </Box>
                  ) : files.length === 0 ? (
                    <Box sx={{ 
                      p: 5, 
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      flex: 1
                    }}>
                      <Box sx={{
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(33, 150, 243, 0.05)',
                        p: 3,
                        borderRadius: '50%',
                        mb: 2
                      }}>
                        <CloudDownloadIcon 
                          sx={{ 
                            fontSize: 60, 
                            color: theme.palette.primary.main,
                            opacity: 0.7
                          }} 
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                        No files uploaded yet
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '400px', mx: 'auto' }}>
                        Upload your first Excel file to get started with data analysis and visualization
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<UploadIcon />}
                        onClick={() => document.getElementById('file-upload-section').scrollIntoView({ behavior: 'smooth' })}
                        sx={{
                          mt: 2,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 'medium',
                          px: 3,
                          py: 1.2,
                          boxShadow: isDarkMode 
                            ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                            : '0 4px 8px rgba(33, 150, 243, 0.2)',
                          '&:hover': {
                            boxShadow: isDarkMode 
                              ? '0 6px 12px rgba(0, 0, 0, 0.5)' 
                              : '0 6px 12px rgba(33, 150, 243, 0.3)',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.3s ease'
                          }
                        }}
                      >
                        Upload Your First File
                      </Button>
                    </Box>
                  ) : filteredFiles.length === 0 ? (
                    <Box sx={{ 
                      p: 5, 
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      flex: 1
                    }}>
                      <Box sx={{
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(33, 150, 243, 0.05)',
                        p: 3,
                        borderRadius: '50%',
                        mb: 2
                      }}>
                        <SearchIcon 
                          sx={{ 
                            fontSize: 60, 
                            color: theme.palette.warning.main,
                            opacity: 0.7
                          }} 
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                        No matching files found
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Try adjusting your search term to find what you're looking for
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<ClearIcon />}
                        onClick={handleClearSearch}
                        sx={{
                          mt: 2,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 'medium'
                        }}
                      >
                        Clear Search
                      </Button>
                    </Box>
                  ) : (
                    <ResponsiveDataView
                      data={filteredFiles}
                      columns={[
                        {
                          field: 'originalName',
                          headerName: 'File Name',
                          renderCell: ({ value, row }) => (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              maxWidth: { xs: '180px', sm: '250px', md: '100%' }
                            }}>
                              <InsertDriveFileIcon 
                                sx={{ 
                                  mr: 1.5, 
                                  color: getFileIconColor(value, theme),
                                  flexShrink: 0 
                                }} 
                              />
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  fontWeight: 'medium', 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: isMobile ? 'normal' : 'nowrap',
                                  wordBreak: isMobile ? 'break-word' : 'normal',
                                  lineHeight: 1.4
                                }}
                              >
                                {value}
                              </Typography>
                            </Box>
                          )
                        },
                        {
                          field: 'uploadDate',
                          headerName: 'Upload Date',
                          renderCell: ({ value }) => (
                            <Typography variant="body2">{formatDate(value)}</Typography>
                          )
                        },
                        {
                          field: 'size',
                          headerName: 'Size',
                          renderCell: ({ value }) => (
                            <Typography variant="body2">{formatFileSize(value)}</Typography>
                          )
                        },
                        {
                          field: 'status',
                          headerName: 'Status',
                          renderCell: ({ value }) => (
                            <Chip 
                              label={value} 
                              size="small"
                              color={getStatusColor(value)}
                              sx={{ 
                                textTransform: 'capitalize',
                                height: '24px',
                                fontSize: '0.75rem',
                                fontWeight: 'medium'
                              }}
                            />
                          )
                        }
                      ]}
                      renderActions={(file) => {
                        // Get button styles from responsiveUtils
                        const buttonStyles = responsiveStyles.buttonStyles(theme, isDarkMode);
                        
                        return (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: 1,
                            flexWrap: 'nowrap'
                          }}>
                            {isMobile ? (
                              <>
                                <Button 
                                  size="small" 
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => handleViewFile(file._id)}
                                  variant="outlined"
                                  sx={{
                                     ...buttonStyles.base,
                                     ...buttonStyles.view,
                                     minWidth: 0,
                                     px: 1,
                                     py: 0.5,
                                     color: theme.palette.primary.main,
                                     borderColor: theme.palette.primary.main
                                   }}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="small" 
                                  startIcon={<DeleteIcon />}
                                  color="error"
                                  variant="outlined"
                                  onClick={() => handleDeleteFile(file._id)}
                                  sx={{
                                    ...buttonStyles.base,
                                    minWidth: 0,
                                    px: 1,
                                    py: 0.5
                                  }}
                                >
                                  Delete
                                </Button>
                              </>
                            ) : (
                              <>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewFile(file._id)}
                                  sx={{ 
                                    color: theme.palette.primary.main, 
                                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                                    width: '32px',
                                    height: '32px'
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteFile(file._id)}
                                  sx={{ 
                                    color: theme.palette.error.main, 
                                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) },
                                    width: '32px',
                                    height: '32px'
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        );
                      }}
                      tableProps={{
                        size: isTablet ? "small" : "medium",
                        sx: {
                          tableLayout: 'fixed',
                          '& .MuiTableCell-root': {
                            py: 1.5,
                            px: { xs: 1, sm: 2 }
                          }
                        }
                      }}
                      containerProps={{
                        sx: { 
                          overflowX: 'auto',
                          overflowY: 'auto',
                          ...responsiveStyles.scrollbarStyles,
                          width: '100%',
                          flex: 1,
                          height: '100%',
                          maxHeight: { xs: '100%', md: '100%' }
                        }
                      }}
                      cardProps={{
                        elevation: 2,
                        sx: { 
                          borderRadius: '12px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          border: '1px solid',
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                        }
                      }}
                    />
                  )}
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default FileManager;