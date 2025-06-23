import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Pagination,
  Tooltip,
  IconButton,
  Avatar
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import AuthContext from '../context/AuthContext';

const UploadHistory = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(8);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fetch files from the server
  const fetchFiles = async () => {
    try {
      setLoading(true);
      console.log('Fetching files');
      const response = await api.get('/api/uploads');
      console.log('Files response:', response.data);
      setFiles(response.data);
      setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err.response?.data?.message || 'Failed to load files');
      setLoading(false);
    }
  };

  // Handle view file details
  const handleViewFile = (id) => {
    navigate(`/files/${id}`);
  };

  // Handle delete file
  const handleDeleteFile = async (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.delete(`/api/uploads/${id}`);
        // Refresh the file list
        fetchFiles();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete file');
      }
    }
  };

  // Handle pagination change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get file icon color based on file type/extension
  const getFileIconColor = (fileName) => {
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return '#4CAF50'; // Green for Excel
    } else if (fileName.endsWith('.csv')) {
      return '#2196F3'; // Blue for CSV
    } else {
      return '#FFC107'; // Amber for other types
    }
  };

  // Calculate current page items
  const getCurrentPageItems = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return files.slice(startIndex, endIndex);
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Render empty state
  if (files.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No files uploaded yet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload Excel files to start analyzing your data
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mb: 4, width: '100%', maxWidth: '1280px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Upload History
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/files')}
        >
          Manage Files
        </Button>
      </Box>

      <Grid container spacing={3}>
        {getCurrentPageItems().map((file) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={file._id}>
            <Card 
              elevation={3} 
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: getFileIconColor(file.originalName),
                      mr: 2
                    }}
                  >
                    <FileIcon />
                  </Avatar>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    noWrap 
                    title={file.originalName}
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%'
                    }}
                  >
                    {file.originalName}
                  </Typography>
                </Box>
                
                <Chip 
                  label={`Status: ${file.status}`}
                  color={getStatusColor(file.status)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(file.uploadDate)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StorageIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>

                {file.sheets && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimelineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {file.sheets.length} sheet{file.sheets.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                <Tooltip title="View Details">
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => handleViewFile(file._id)}
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete File">
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteFile(file._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      )}
    </Box>
  );
};

export default UploadHistory;