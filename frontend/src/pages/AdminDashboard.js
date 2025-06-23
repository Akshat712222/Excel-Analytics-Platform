import React, { useState, useEffect, useContext } from 'react';
import { api } from '../utils/api';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  PeopleAlt,
  Storage,
  Speed,
  Person,
  AccessTime,
  BarChart,
  Timeline
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import AuthContext from '../context/AuthContext';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await api.get('/api/dashboard/admin');
        setAdminData(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin dashboard data');
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Sample chart data (would be replaced with real data from API)
  const userChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Users',
        data: [3, 5, 2, 8, 10, 5],
        backgroundColor: '#4CAF50',
      },
      {
        label: 'Active Users',
        data: [10, 15, 18, 22, 25, 28],
        backgroundColor: '#2196F3',
      },
    ],
  };

  const apiRequestsData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'API Requests',
        data: [1200, 1900, 1500, 1800, 2200, 1100, 900],
        borderColor: '#FF5722',
        backgroundColor: 'rgba(255, 87, 34, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Button variant="contained" color="primary">
          Generate Report
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* User Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleAlt sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  User Statistics
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {adminData?.userStats?.totalUsers}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    New Users This Month
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {adminData?.userStats?.newUsersThisMonth}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {adminData?.userStats?.activeUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  System Statistics
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Server Uptime
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {adminData?.systemStats?.serverUptime}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Database Size
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {adminData?.systemStats?.databaseSize}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    API Requests
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {adminData?.systemStats?.apiRequests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#fff8e1' }}>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" fullWidth>
                  Manage Users
                </Button>
                <Button variant="outlined" fullWidth>
                  System Settings
                </Button>
                <Button variant="outlined" fullWidth>
                  View Logs
                </Button>
                <Button variant="outlined" fullWidth>
                  Backup Database
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User Activity Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              User Growth
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Bar data={userChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* API Requests Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              API Requests (Last 7 Days)
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Line data={apiRequestsData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Activity
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminData?.recentActivity?.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>{activity.user}</TableCell>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small">Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;