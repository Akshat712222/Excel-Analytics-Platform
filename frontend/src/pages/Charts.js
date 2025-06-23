import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Paper,
  InputAdornment,
  OutlinedInput,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import AuthContext from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler } from 'chart.js';
import { motion } from 'framer-motion';
import ChartCard from '../components/ChartCard';
import { useIsDarkMode } from '../utils/chartUtils';


// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
  ChartTooltip,
  Legend
);

const Charts = () => {
  const [charts, setCharts] = useState([]);
  const [filteredCharts, setFilteredCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  
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
  
  const cardHoverVariants = {
    hover: { 
      scale: 1.03, 
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: { duration: 0.3 }
    }
  };
  
  // Get theme and determine if dark mode is active
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  
  // Responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    const fetchCharts = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        const res = await api.get('/api/charts');
        setCharts(res.data);
        setFilteredCharts(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching charts:', err);
        
        // Implement retry logic (max 3 retries)
        if (retryCount < 3) {
          setError(`Attempting to reconnect... (${retryCount + 1}/3)`);
          setTimeout(() => {
            fetchCharts(retryCount + 1);
          }, 2000); // Wait 2 seconds before retrying
        } else {
          // After max retries, show a more helpful error message
          const errorMessage = err.response?.data?.message || 
                             (err.message === 'Network Error' ? 
                               'Network connection issue. Please check your internet connection.' : 
                               'Failed to load charts. Please try refreshing the page.');
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    fetchCharts();
    
    // Add cleanup function
    return () => {
      setCharts([]);
      setFilteredCharts([]);
      setLoading(false);
      setError(null);
    };
  }, []);
  
  // Filter charts based on search term and filter type
  useEffect(() => {
    const filtered = charts.filter(chart => {
      const matchesSearch = chart.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (chart.description && chart.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || chart.type === filterType;
      
      return matchesSearch && matchesType;
    });
    
    setFilteredCharts(filtered);
  }, [searchTerm, filterType, charts]);

  const handleDeleteChart = async (chartId) => {
    if (window.confirm('Are you sure you want to delete this chart?')) {
      try {
        await api.delete(`/api/charts/${chartId}`);
        setCharts(charts.filter(chart => chart._id !== chartId));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete chart');
      }
    }
  };

  // Removed getChartIcon and formatDate functions as they're now in ChartCard component

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-screen">
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

  if (error) {
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
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  const fetchCharts = async () => {
                    try {
                      const res = await api.get('/api/charts');
                      setCharts(res.data);
                      setFilteredCharts(res.data);
                      setLoading(false);
                    } catch (err) {
                      console.error('Error refreshing charts:', err);
                      const errorMessage = err.response?.data?.message || 
                                         (err.message === 'Network Error' ? 
                                           'Network connection issue. Please check your internet connection.' : 
                                           'Failed to load charts. Please try again.');
                      setError(errorMessage);
                      setLoading(false);
                    }
                  };
                  fetchCharts();
                }}
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-6 pb-12 max-w-7xl flex-grow flex flex-col" /* Added pb-12 for footer space */
    >
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-gray-200"
      >
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-primary-50 p-3 rounded-full mr-4">
            <BarChartIcon sx={{ fontSize: isMobile ? 28 : 36, color: '#3B82F6' }} />
          </div>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            className="font-poppins font-bold text-gray-800"
            sx={{ fontSize: isMobile ? '1.5rem' : '2.125rem' }}
          >
            My Charts
          </Typography>
        </div>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/charts/create')}
          className="btn btn-primary"
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          Create New Chart
        </Button>
      </motion.div>
      
      {/* Search and Filter Bar */}
      <motion.div variants={itemVariants} className="mb-8">
        <Paper 
          className="rounded-xl shadow-md" 
          sx={{ 
            bgcolor: isDarkMode ? 'background.paper' : 'white',
            p: isMobile ? 2 : 4 
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full">
              <TextField
                placeholder="Search charts..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color={isDarkMode ? 'primary' : 'action'} />
                    </InputAdornment>
                  ),
                  className: "rounded-lg",
                  sx: {
                    color: isDarkMode ? 'white' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </div>
            <div className="w-full md:w-auto">
              <FormControl sx={{ minWidth: isMobile ? '100%' : 200 }} size="small">
                <InputLabel id="chart-type-filter-label" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'inherit' }}>Chart Type</InputLabel>
                <Select
                  labelId="chart-type-filter-label"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  input={<OutlinedInput label="Chart Type" sx={{ 
                    color: isDarkMode ? 'white' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }} />}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon color={isDarkMode ? 'primary' : 'action'} />
                    </InputAdornment>
                  }
                  className="rounded-lg"
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: isDarkMode ? 'background.paper' : 'white',
                      }
                    }
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="bar">Bar</MenuItem>
                  <MenuItem value="pie">Pie</MenuItem>
                  <MenuItem value="doughnut">Doughnut</MenuItem>
                  <MenuItem value="line">Line</MenuItem>
                  <MenuItem value="radar">Radar</MenuItem>
                  <MenuItem value="polarArea">Polar Area</MenuItem>
                  <MenuItem value="scatter">Scatter</MenuItem>
                  <MenuItem value="bubble">Bubble</MenuItem>
                </Select>
              </FormControl>
            </div>
            {(searchTerm || filterType !== 'all') && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
                className="btn btn-outline"
                size="small"
                sx={{
                  color: isDarkMode ? 'primary.light' : 'primary.main',
                  borderColor: isDarkMode ? 'primary.light' : 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: isDarkMode ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </Paper>
      </motion.div>

      {charts.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Paper className="p-8 rounded-xl shadow-md text-center" sx={{ bgcolor: isDarkMode ? 'background.paper' : 'white' }}>
            <div className="flex flex-col items-center justify-center py-8">
              <div className={`${isDarkMode ? 'bg-blue-900' : 'bg-primary-50'} p-6 rounded-full mb-4`}>
                <BarChartIcon sx={{ fontSize: 48, color: isDarkMode ? '#60A5FA' : '#3B82F6' }} />
              </div>
              <Typography variant="h5" className="font-poppins font-semibold mb-2" sx={{ color: isDarkMode ? 'white' : 'text.primary' }}>
                You haven't created any charts yet
              </Typography>
              <Typography variant="body1" className="max-w-md mx-auto mb-6" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
                Create your first chart by uploading an Excel file and selecting the data to visualize.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/files')}
                className="btn btn-primary py-2 px-6"
                sx={{
                  boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: isDarkMode ? '0 6px 8px rgba(0, 0, 0, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.2)'
                  }
                }}
              >
                Browse Files
              </Button>
            </div>
          </Paper>
        </motion.div>
      ) : (
        <>
          {filteredCharts.length === 0 ? (
            <motion.div variants={itemVariants}>
              <Paper className="p-8 rounded-xl shadow-md text-center" sx={{ bgcolor: isDarkMode ? 'background.paper' : 'white' }}>
                <div className="flex flex-col items-center justify-center py-8">
                  <div className={`${isDarkMode ? 'bg-amber-900' : 'bg-amber-50'} p-6 rounded-full mb-4`}>
                    <SearchIcon sx={{ fontSize: 48, color: isDarkMode ? '#FCD34D' : '#F59E0B' }} />
                  </div>
                  <Typography variant="h5" className="font-poppins font-semibold mb-2" sx={{ color: isDarkMode ? 'white' : 'text.primary' }}>
                    No charts match your search
                  </Typography>
                  <Typography variant="body1" className="max-w-md mx-auto mb-6" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
                    Try adjusting your search term or filter to find what you're looking for.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                    }}
                    className="btn btn-outline py-2 px-6"
                    sx={{
                      color: isDarkMode ? 'primary.light' : 'primary.main',
                      borderColor: isDarkMode ? 'primary.light' : 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: isDarkMode ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </Paper>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gap: isMobile ? '0.75rem' : '1.5rem' }}>
              {filteredCharts.map((chart) => (
                <motion.div 
                  key={chart._id}
                  variants={itemVariants}
                  className="h-full"
                >
                  <ChartCard chart={chart} onDelete={handleDeleteChart} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Charts;