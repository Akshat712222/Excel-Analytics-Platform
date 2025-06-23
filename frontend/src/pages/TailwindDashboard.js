import React, { useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';
import AuthContext from '../context/AuthContext';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  CircularProgress,
  Chip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const TailwindDashboard = () => {
  const [stats, setStats] = useState({
    totalUploads: 0,
    processedFiles: 0,
    pendingFiles: 0,
    errorFiles: 0
  });
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  
  // Define styles
  const styles = {
    container: {
      py: 3,
      px: 2,
    },
    welcomeCard: {
      mb: 3,
      p: 3,
    },
    statsCard: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    statsIcon: {
      p: 1,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mr: 2,
    },
    tableContainer: {
      mt: 3,
    },
    uploadCard: {
      mt: 3,
      p: 3,
      textAlign: 'center',
    },
    uploadIcon: {
      fontSize: 60,
      color: 'text.secondary',
      mb: 2,
    },
    uploadButton: {
      mt: 2,
    },
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard stats
        const statsResponse = await api.get('/api/dashboard/stats');
        
        // Fetch recent uploads
        const uploadsResponse = await api.get('/api/uploads/recent');
        
        setStats(statsResponse.data);
        setRecentUploads(uploadsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
        // Use mock data for demonstration
        setStats({
          totalUploads: 24,
          processedFiles: 18,
          pendingFiles: 4,
          errorFiles: 2
        });
        setRecentUploads([
          { id: 1, filename: 'Q1_Sales_Report.xlsx', status: 'Processed', uploadDate: '2023-06-15T10:30:00Z', size: '1.2 MB' },
          { id: 2, filename: 'Customer_Data_2023.xlsx', status: 'Processed', uploadDate: '2023-06-14T14:45:00Z', size: '3.5 MB' },
          { id: 3, filename: 'Marketing_Budget.xlsx', status: 'Pending', uploadDate: '2023-06-14T09:15:00Z', size: '0.8 MB' },
          { id: 4, filename: 'Employee_Records.xlsx', status: 'Error', uploadDate: '2023-06-13T16:20:00Z', size: '2.1 MB' },
          { id: 5, filename: 'Product_Inventory.xlsx', status: 'Processed', uploadDate: '2023-06-12T11:10:00Z', size: '1.7 MB' },
        ]);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status color class based on status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Container maxWidth="lg" sx={styles.container}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Welcome section */}
          <Paper elevation={2} sx={styles.welcomeCard}>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome back, {user?.name || 'User'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with your Excel files today.
            </Typography>
          </Paper>

          {/* Stats cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={styles.statsCard}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ ...styles.statsIcon, bgcolor: 'primary.light' }}>
                      <DashboardIcon color="primary" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Uploads
                      </Typography>
                      <Typography variant="h5">
                        {stats.totalUploads}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={styles.statsCard}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ ...styles.statsIcon, bgcolor: 'success.light' }}>
                      <CheckCircleIcon color="success" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Processed
                      </Typography>
                      <Typography variant="h5">
                        {stats.processedFiles}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={styles.statsCard}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ ...styles.statsIcon, bgcolor: 'warning.light' }}>
                      <ScheduleIcon color="warning" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                      <Typography variant="h5">
                        {stats.pendingFiles}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={2} sx={styles.statsCard}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ ...styles.statsIcon, bgcolor: 'error.light' }}>
                      <ErrorIcon color="error" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Errors
                      </Typography>
                      <Typography variant="h5">
                        {stats.errorFiles}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent uploads */}
          <Paper elevation={2} sx={styles.tableContainer}>
            <Box p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6">Recent Uploads</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Filename</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <DashboardIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                          <Typography variant="body2">{upload.filename}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={upload.status}
                          color={
                            upload.status.toLowerCase() === 'processed' ? 'success' :
                            upload.status.toLowerCase() === 'pending' ? 'warning' :
                            upload.status.toLowerCase() === 'error' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(upload.uploadDate)}</TableCell>
                      <TableCell>{upload.size}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {recentUploads.length === 0 && (
              <Box p={3} textAlign="center" color="text.secondary">
                <Typography>No uploads found</Typography>
              </Box>
            )}
            <Box p={2} borderTop={1} borderColor="divider" bgcolor="grey.50">
              <Button color="primary" size="small" href="/uploads">
                View all uploads
              </Button>
            </Box>
          </Paper>

          {/* Quick upload card */}
          <Paper elevation={2} sx={styles.uploadCard}>
            <Typography variant="h6" gutterBottom>
              Quick Upload
            </Typography>
            <Box 
              border={2} 
              borderColor="divider" 
              borderRadius={1} 
              borderStyle="dashed" 
              p={3} 
              textAlign="center"
            >
              <CloudUploadIcon sx={styles.uploadIcon} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Drag and drop your Excel file here, or
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={styles.uploadButton}
              >
                Browse files
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default TailwindDashboard;