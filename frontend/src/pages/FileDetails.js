import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  useTheme,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import ResponsiveDataView from '../components/common/ResponsiveDataView';
import ResponsiveContainer from '../components/common/ResponsiveContainer';
import { useResponsiveBreakpoints } from '../utils/responsiveUtils';
import {
  ArrowBack as ArrowBackIcon,
  CloudDownload as CloudDownloadIcon,
  Save as SaveIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { getStatusColor, alpha } from '../utils/fileUtils';

// TabPanel component for the sheet tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sheet-tabpanel-${index}`}
      aria-labelledby={`sheet-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FileDetails = () => {
  const { id } = useParams();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsiveBreakpoints();

  // Fetch file data on component mount
  useEffect(() => {
    fetchFileData();
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Not available';
      
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not available';
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return 'Not available';
    try {
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (error) {
      console.error('Error formatting file size:', error);
      return 'Not available';
    }
  };

  // Fetch file data from the server with enhanced retry functionality
  const fetchFileData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Use our api utility with automatic retry instead of axios directly
      const response = await api.get(`/api/uploads/${id}/data`, {
        timeout: 15000 // 15 second timeout
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      setFileData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching file data:', err);
      
      // Implement enhanced retry logic (max 3 retries)
      if (retryCount < 3) {
        // Provide more specific feedback during retry attempts
        const retryMessage = retryCount === 0 ?
          `Connection issue detected. Attempting to reconnect... (${retryCount + 1}/3)` :
          `Still trying to connect... (Attempt ${retryCount + 1}/3)`;
        
        setError(retryMessage);
        
        // Exponential backoff: 2s, 4s, 8s
        const backoffTime = 2000 * Math.pow(2, retryCount);
        
        setTimeout(() => {
          fetchFileData(retryCount + 1);
        }, backoffTime);
      } else {
        // After max retries, show a more detailed error message based on error type
        let errorMessage;
        
        if (err.message === 'Network Error') {
          errorMessage = navigator.onLine ?
            'Network connection issue. The server appears to be unreachable. Please try again later.' :
            'You appear to be offline. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. The server is taking too long to respond. This might be due to high traffic or server maintenance.';
        } else if (err.response?.status === 404) {
          errorMessage = 'The requested file could not be found. It may have been deleted or moved.';
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to access this file.';
        } else if (err.response?.status >= 500) {
          errorMessage = 'Server error occurred. Our team has been notified. Please try again later.';
        } else {
          errorMessage = err.response?.data?.message || 'Failed to view file data. Please try refreshing the page.';
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Export the current sheet to Excel
  const exportToExcel = () => {
    if (!fileData || !fileData.sheets || fileData.sheets.length === 0) return;
    
    const currentSheet = fileData.sheets[activeTab];
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert the data to a worksheet
    // First row is headers, rest is data
    const wsData = [
      currentSheet.headers,
      ...currentSheet.data
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, currentSheet.name);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${fileData.originalName}_${currentSheet.name}.xlsx`);
  };

  // Navigate back to file manager
  const handleBack = () => {
    navigate('/files');
  };

  // Render loading state
  if (loading && !fileData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="body1" color="text.secondary">
            Loading file data...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Render error state
  if (error && !fileData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: theme.palette.error.light,
            bgcolor: alpha(theme.palette.error.light, 0.05)
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Unable to Load File Data
          </Typography>
          
          <Alert 
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={() => fetchFileData()}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            This could be due to network issues, server problems, or the file may be corrupted.
            Please check your network connection or try again later.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            If the problem persists, please contact support with the following information:
            <br />• File ID: {id}
            <br />• Time: {new Date().toLocaleTimeString()}
            <br />• Browser: {navigator.userAgent}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Back to File Manager
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => fetchFileData()}
            >
              Retry Loading
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // If no file data is available
  if (!fileData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">No data available for this file.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to File Manager
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <ResponsiveContainer
            mobileContent={
              <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', alignItems: 'flex-start',
                gap: 2
              }}>
                <Box>
                  <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem' }}>
                    File Details
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    View and analyze your Excel file
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 1,
                  width: '100%'
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/files')}
                    fullWidth={true}
                  >
                    Back to Files
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownloadIcon />}
                    onClick={exportToExcel}
                    fullWidth={true}
                  >
                    Export to Excel
                  </Button>
                </Box>
              </Box>
            }
            desktopContent={
              <Box sx={{ mb: 4, display: 'flex', flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
                gap: 0
              }}>
                <Box>
                  <Typography variant="h4" gutterBottom sx={{ fontSize: '2.125rem' }}>
                    File Details
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    View and analyze your Excel file
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  gap: 2,
                  width: 'auto'
                }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/files')}
                    fullWidth={false}
                  >
                    Back to Files
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<CloudDownloadIcon />}
                    onClick={exportToExcel}
                    fullWidth={false}
                  >
                    Export to Excel
                  </Button>
                </Box>
              </Box>
            }
          />

          <Paper elevation={3} sx={{ borderRadius: '12px', overflow: 'hidden', mb: 4 }}>
            <Box sx={{ p: isMobile ? 2 : 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold',
                fontSize: isMobile ? '1rem' : '1.25rem',
                wordBreak: 'break-word'
              }}>
                {fileData?.file?.originalName}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                mt: 1,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 1 : 0
              }}>
                <Chip 
                  label={fileData?.file?.status} 
                  size="small"
                  color={getStatusColor(fileData?.file?.status)}
                  sx={{ mr: isMobile ? 0 : 2, mb: isMobile ? 1 : 0, alignSelf: isMobile ? 'flex-start' : 'center' }}
                  onClick={(e) => e.preventDefault()}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mr: isMobile ? 0 : 3 }}>
                  Uploaded: {fileData?.file?.uploadDate ? formatDate(fileData.file.uploadDate) : 'Not available'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {fileData?.file?.size ? formatFileSize(fileData.file.size) : 'Not available'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="file tabs"
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 'medium',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    minWidth: isMobile ? 80 : 100,
                    padding: isMobile ? '12px 16px' : '12px 24px',
                  },
                }}
              >
                <Tab label="Preview" />
                <Tab label="Analysis" />
                <Tab label="Metadata" />
              </Tabs>
            </Box>

            {/* Preview Tab */}
            {activeTab === 0 && (
              <ResponsiveContainer
                mobileContent={
                  <Box sx={{ p: 0 }}>
                    {fileData && fileData.sheets && fileData.sheets[0] && fileData.sheets[0].data.length > 0 ? (
                      <TableContainer sx={{ 
                        maxHeight: 400,
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': { height: '8px', width: '8px' },
                        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }
                      }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              {fileData && fileData.sheets && fileData.sheets[0] && fileData.sheets[0].headers.map((column, index) => (
                                <TableCell key={index} sx={{ 
                                  fontWeight: 'bold', 
                                  bgcolor: 'background.paper',
                                  whiteSpace: 'nowrap',
                                  padding: '8px'
                                }}>
                                  {column}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fileData.sheets[0].data.map((row, rowIndex) => (
                              <TableRow key={rowIndex} hover>
                                {row.map((cell, cellIndex) => (
                                  <TableCell key={cellIndex} sx={{ 
                                    padding: '8px',
                                    maxWidth: '150px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {cell}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No preview data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
                desktopContent={
                  <Box sx={{ p: 0 }}>
                    {fileData && fileData.sheets && fileData.sheets[0] && fileData.sheets[0].data.length > 0 ? (
                      <TableContainer sx={{ 
                        maxHeight: 600,
                        overflowX: 'auto',
                        '&::-webkit-scrollbar': { height: '8px', width: '8px' },
                        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }
                      }}>
                        <Table stickyHeader size="medium">
                          <TableHead>
                            <TableRow>
                              {fileData && fileData.sheets && fileData.sheets[0] && fileData.sheets[0].headers.map((column, index) => (
                                <TableCell key={index} sx={{ 
                                  fontWeight: 'bold', 
                                  bgcolor: 'background.paper',
                                  whiteSpace: 'nowrap',
                                  padding: '16px'
                                }}>
                                  {column}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fileData.sheets[0].data.map((row, rowIndex) => (
                              <TableRow key={rowIndex} hover>
                                {row.map((cell, cellIndex) => (
                                  <TableCell key={cellIndex} sx={{ 
                                    padding: '16px',
                                    maxWidth: '300px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {cell}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No preview data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
              />
            )}

            {/* Analysis Tab */}
            {activeTab === 1 && (
              <Box sx={{ p: isMobile ? 2 : 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                  Data Analysis
                </Typography>
                <Typography variant="body1" paragraph>
                  This section will show analytics and insights from your Excel data.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Summary Statistics
                  </Typography>
                  <ResponsiveDataView
                    data={[
                      {
                        metric: 'Total Rows',
                        value: fileData.sheets && fileData.sheets[0] ? fileData.sheets[0].data.length : 'N/A'
                      },
                      {
                        metric: 'Total Columns',
                        value: fileData.sheets && fileData.sheets[0] && fileData.sheets[0].headers ? fileData.sheets[0].headers.length : 'N/A'
                      },
                      {
                        metric: 'Processing Status',
                        value: fileData?.file?.status,
                        renderCell: ({ value }) => (
                          <Chip 
                            label={value} 
                            size="small"
                            color={getStatusColor(value)}
                            onClick={(e) => e.preventDefault()}
                          />
                        )
                      }
                    ]}
                    columns={[
                      {
                        field: 'metric',
                        headerName: 'Metric',
                        align: 'left'
                      },
                      {
                        field: 'value',
                        headerName: 'Value',
                        renderCell: ({ value, row }) => row.renderCell ? row.renderCell({ value }) : (row.renderValue ? row.renderValue(value) : value)
                      }
                    ]}
                    forceCardView={isMobile}
                    forceTableView={!isMobile}
                    tableProps={{
                      size: "small"
                    }}
                    containerProps={{
                      component: Paper,
                      sx: { mt: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }
                    }}
                    cardProps={{
                      variant: "outlined",
                      sx: { mb: 2, mt: 1 }
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Metadata Tab */}
            {activeTab === 2 && (
              <Box sx={{ p: isMobile ? 2 : 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                  File Metadata
                </Typography>
                <ResponsiveDataView
                  data={[
                    {
                      name: 'File Name',
                      value: fileData?.file?.originalName,
                      renderCell: ({ value }) => (
                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{value}</Typography>
                      )
                    },
                    {
                      name: 'File ID',
                      value: fileData?.file?._id,
                      renderCell: ({ value }) => (
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{value}</Typography>
                      )
                    },
                    {
                      name: 'Upload Date',
                      value: fileData?.file?.uploadDate,
                      renderCell: ({ value }) => formatDate(value)
                    },
                    {
                      name: 'File Size',
                      value: fileData?.file?.size,
                      renderCell: ({ value }) => formatFileSize(value)
                    },
                    {
                      name: 'File Type',
                      value: fileData?.file?.mimetype
                    },
                    {
                      name: 'Status',
                      value: fileData?.file?.status,
                      renderCell: ({ value }) => (
                        <Chip 
                          label={value} 
                          size="small"
                          color={getStatusColor(value)}
                          onClick={(e) => e.preventDefault()}
                        />
                      )
                    }
                  ]}
                  columns={[
                    {
                      field: 'name',
                      headerName: 'Property',
                      align: 'left'
                    },
                    {
                      field: 'value',
                      headerName: 'Value',
                      renderCell: ({ value, row }) => row.renderCell ? row.renderCell({ value }) : (row.renderValue ? row.renderValue(value) : value)
                    }
                  ]}
                  forceCardView={isMobile}
                  forceTableView={!isMobile}
                  tableProps={{
                    size: "small"
                  }}
                  containerProps={{
                    component: Paper,
                    sx: { boxShadow: 'none', border: '1px solid', borderColor: 'divider' }
                  }}
                  cardProps={{
                    variant: "outlined",
                    sx: { mb: 2 }
                  }}
                />
              </Box>
            )}
          </Paper>
        </>
      )}
    </Container>
  );
};

export default FileDetails;