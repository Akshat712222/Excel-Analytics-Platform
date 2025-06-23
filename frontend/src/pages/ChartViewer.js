import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { responsiveStyles } from '../utils/responsiveUtils';
import {
  TableChart as TableChartIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Fullscreen as FullscreenIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { formatChartData, getChartTypeIcon, useIsDarkMode } from '../utils/chartUtils';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import AIInsightPanel from '../components/AIInsightPanel';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Scatter, Bubble, Radar, PolarArea, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const ChartViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [chart, setChart] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'unstable', 'disconnected'
  const chartContainerRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = useIsDarkMode();
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Render connection status indicator
  const renderConnectionStatus = () => {
    const statusColors = {
      checking: theme.palette.grey[500],
      connected: theme.palette.success.main,
      unstable: theme.palette.warning.main,
      disconnected: theme.palette.error.main
    };
    
    const statusLabels = {
      checking: 'Checking connection...',
      connected: 'Connected',
      unstable: 'Unstable connection',
      disconnected: 'Disconnected'
    };
    
    return (
      <Tooltip title={statusLabels[connectionStatus]}>
        <Chip
          size="small"
          label={statusLabels[connectionStatus]}
          sx={{
            backgroundColor: statusColors[connectionStatus],
            color: '#fff',
            '& .MuiChip-label': {
              fontWeight: 500
            },
            ml: 1
          }}
        />
      </Tooltip>
    );
  };
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Fetch chart data on component mount
  useEffect(() => {
    const fetchChart = async (retryCount = 0) => {
      setLoading(true);
      setError(null); // Reset error state on each fetch attempt
      
      try {
        // Validate chart ID
        if (!id) {
          throw new Error('Invalid chart ID');
        }
        
        // First check API health to verify connection
        try {
          console.log('Checking API health before fetching chart...');
          const healthCheck = await axios.get('/api/charts/health/check', { timeout: 5000 });
          console.log('API health check result:', healthCheck.data);
          
          // Update connection status based on health check
          if (healthCheck.data.database.state === 1 && healthCheck.data.database.querySuccess) {
            setConnectionStatus('connected');
          } else if (healthCheck.data.database.state === 1 && !healthCheck.data.database.querySuccess) {
            setConnectionStatus('unstable');
          } else {
            setConnectionStatus('disconnected');
          }
          
          // If database is not connected, wait and retry
          if (healthCheck.data.database.state !== 1 || !healthCheck.data.database.querySuccess) {
            console.warn('Database connection issues detected, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Retry with same retry count (doesn't increment counter)
            return fetchChart(retryCount);
          }
        } catch (healthError) {
          console.error('API health check failed:', healthError);
          setConnectionStatus('unstable'); // Set to unstable if health check fails
          // Continue with chart fetch attempt anyway
        }
        
        const timestamp = new Date().getTime();
        console.log(`Attempting to fetch chart with ID: ${id} (Attempt ${retryCount + 1}) at ${timestamp}`);
        
        // Add request timeout to prevent hanging requests
        const res = await axios.get(`/api/charts/${id}`, {
          headers: { 
            'x-auth-token': token,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          // Add a timestamp to prevent caching
          params: { _t: timestamp },
          timeout: 20000 // 20 second timeout
        });
        
        console.log('Chart data received:', res.data);
        
        // Enhanced validation of chart data
        if (!res.data) {
          throw new Error('No data received from server');
        }
        
        if (!res.data.processedData) {
          throw new Error('Chart data is missing processed data');
        }
        
        if (!res.data.processedData.datasets || res.data.processedData.datasets.length === 0) {
          throw new Error('Chart data contains no datasets');
        }
        
        if (!res.data.config || !res.data.config.xAxis || !res.data.config.yAxis) {
          throw new Error('Chart configuration is incomplete');
        }
        
        setChart(res.data);
        
        // Format chart data for Chart.js using the utility function
        const { data, options } = formatChartData(res.data, isDarkMode);
        console.log('Formatted chart data:', data);
        console.log('Chart options:', options);
        
        if (!data || !options) {
          throw new Error('Failed to format chart data');
        }
        
        setChartData(data);
        setChartOptions(options);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching chart:', err);
        let errorMessage = 'Failed to load chart';
        
        // Log detailed error information
        console.log('Error details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          config: err.config,
          code: err.code,
          chartId: id,
          retryCount
        });
        
        // Provide more specific error messages
        if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. The server is taking too long to respond.';
        } else if (err.response?.status === 404) {
          errorMessage = 'Chart not found. It may have been deleted.';
          console.log(`Chart not found error for ID: ${id}. Response:`, err.response?.data);
          
          // More aggressive retry for 404 errors - might be a timing issue with database
          const maxRetries = 8; // Increase max retries even more
          if (retryCount < maxRetries) {
            // Exponential backoff with jitter to prevent thundering herd
            const baseDelay = Math.min(1000 * Math.pow(1.5, retryCount), 15000);
            const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
            const retryDelay = baseDelay + jitter;
            
            console.log(`Retrying chart fetch (${retryCount + 1}/${maxRetries}) in ${retryDelay}ms...`);
            
            // Show retry status to user
            setError(`Chart data not found. Retrying (${retryCount + 1}/${maxRetries})...`);
            
            setTimeout(() => {
              fetchChart(retryCount + 1);
            }, retryDelay);
            return;
          }
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to view this chart.';
        } else if (err.response?.status >= 500) {
          errorMessage = `Server error (${err.response?.status}). Please try again later.`;
          
          // Enhanced retry for server errors
          const maxServerRetries = 5;
          if (retryCount < maxServerRetries) {
            // Exponential backoff with longer delays for server errors
            const baseDelay = 2000 * Math.pow(2, retryCount);
            const jitter = Math.random() * 2000; // Add up to 2 seconds of random jitter
            const retryDelay = baseDelay + jitter;
            
            console.log(`Server error (${err.response?.status}). Retrying (${retryCount + 1}/${maxServerRetries}) in ${retryDelay}ms...`);
            
            // Show retry status to user
            setError(`Server error. Retrying (${retryCount + 1}/${maxServerRetries})...`);
            
            setTimeout(() => {
              fetchChart(retryCount + 1);
            }, retryDelay);
            return;
          }
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };
    
    fetchChart();
  }, [id, token, isDarkMode]);
  
  
  
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleEdit = () => {
    handleMenuClose();
    navigate(`/charts/edit/${id}`);
  };
  
  const handleDelete = async () => {
    handleMenuClose();
    if (window.confirm('Are you sure you want to delete this chart?')) {
      try {
        await axios.delete(`/api/charts/${id}`, {
          headers: { 'x-auth-token': token }
        });
        navigate('/charts');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete chart');
      }
    }
  };
  
  const handleRefresh = async () => {
    handleMenuClose();
    setLoading(true);
    try {
      const res = await axios.get(`/api/charts/${id}/refresh`, {
        headers: { 'x-auth-token': token }
      });
      setChart(res.data);
      const { data, options } = formatChartData(res.data, isDarkMode);
      setChartData(data);
      setChartOptions(options);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh chart data');
      setLoading(false);
    }
  };
  
  const handleDownloadPNG = () => {
    handleMenuClose();
    // Get the canvas element
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.download = `${chart.title || 'chart'}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadPDF = () => {
    handleMenuClose();
    // Get the chart container element
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) {
      console.error('Chart container not found');
      return;
    }
    
    try {
      // Set a class to ensure proper rendering during capture
      chartContainer.classList.add('pdf-export');
      
      // Configure html2canvas with high quality settings
      html2canvas(chartContainer, {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        letterRendering: true, // Improves text rendering quality
        dpi: 300, // Higher DPI for better print quality
        imageTimeout: 0, // No timeout for images
        onclone: function(clonedDoc) {
          // Any modifications to the cloned document can be done here
          const clonedContainer = clonedDoc.querySelector('.pdf-export');
          if (clonedContainer) {
            clonedContainer.style.width = chartContainer.offsetWidth + 'px';
            clonedContainer.style.height = chartContainer.offsetHeight + 'px';
          }
        }
      }).then(canvas => {
        // Remove the temporary class
        chartContainer.classList.remove('pdf-export');
        
        // Calculate dimensions for PDF
        const imgData = canvas.toDataURL('image/png', 1.0); // Use maximum quality
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9;
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = (pdfHeight - imgHeight * ratio) / 2;
        
        // Add chart image to PDF
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        
        // Add metadata
        pdf.setFontSize(10);
        const title = chart && chart.title ? chart.title : 'Untitled Chart';
        pdf.text(`Chart: ${title}`, 10, pdfHeight - 10);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, pdfWidth - 70, pdfHeight - 10);
        
        // Save the PDF
        pdf.save(`${title}.pdf`);
      }).catch(error => {
        console.error('Error generating PDF:', error);
        chartContainer.classList.remove('pdf-export');
        alert('Failed to generate PDF. Please try again.');
      });
    } catch (error) {
      console.error('Error in PDF generation process:', error);
      chartContainer.classList.remove('pdf-export');
      alert('An error occurred while generating the PDF. Please try again.');
    }
  };
  
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  const renderChartTypeIcon = (type) => {
    const IconComponent = getChartTypeIcon(type);
    return <IconComponent />;
  };
  
  const renderChartComponent = () => {
    // Enhanced validation and error handling for chart rendering
    if (!chartData || !chartOptions) {
      console.log('No chart data or options available for rendering');
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: isMobile ? 300 : 400 }}>
          <Typography variant="body1" color="error" sx={{ fontSize: isMobile ? '0.875rem' : '1rem', mb: 2 }}>
            No chart data available
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            size="small"
          >
            Refresh Data
          </Button>
        </Box>
      );
    }
    
    // More detailed validation of chart data
    console.log('Validating chart data for rendering:', chartData);
    
    // Check if chartData has datasets
    if (!chartData.datasets || !Array.isArray(chartData.datasets)) {
      console.error('Chart data is missing datasets array:', chartData);
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: isMobile ? 300 : 400 }}>
          <Typography variant="body1" color="error" sx={{ fontSize: isMobile ? '0.875rem' : '1rem', mb: 2 }}>
            Chart data structure is invalid
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem', mb: 2, textAlign: 'center', maxWidth: '80%' }}>
            The chart data is missing required components. Please edit the chart to fix the configuration.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              size="small"
            >
              Refresh Data
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleEdit}
              startIcon={<EditIcon />}
              size="small"
            >
              Edit Chart
            </Button>
          </Box>
        </Box>
      );
    }
    
    // Check if datasets array is empty
    if (chartData.datasets.length === 0) {
      console.error('Chart data has empty datasets array:', chartData);
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: isMobile ? 300 : 400 }}>
          <Typography variant="body1" color="error" sx={{ fontSize: isMobile ? '0.875rem' : '1rem', mb: 2 }}>
            Chart data contains no datasets
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem', mb: 2, textAlign: 'center', maxWidth: '80%' }}>
            Please edit the chart and select valid data columns for visualization.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              size="small"
            >
              Refresh Data
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleEdit}
              startIcon={<EditIcon />}
              size="small"
            >
              Edit Chart
            </Button>
          </Box>
        </Box>
      );
    }
    
    // Check if any dataset has valid data
    const hasValidData = chartData.datasets.some(dataset => 
      dataset && dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0
    );
    
    if (!hasValidData) {
      console.error('Chart data has no valid data in any dataset:', chartData.datasets);
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: isMobile ? 300 : 400 }}>
          <Typography variant="body1" color="error" sx={{ fontSize: isMobile ? '0.875rem' : '1rem', mb: 2 }}>
            Chart data is empty or invalid
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem', mb: 2, textAlign: 'center', maxWidth: '80%' }}>
            This may be due to missing or invalid axis selections. Please edit the chart to ensure proper configuration.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              size="small"
            >
              Refresh Data
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleEdit}
              startIcon={<EditIcon />}
              size="small"
            >
              Edit Chart
            </Button>
          </Box>
        </Box>
      );
    }
    
    // For non-scatter/bubble charts, check if labels exist and are valid
    if (!['scatter', 'bubble'].includes(chart.type) && 
        (!chartData.labels || !Array.isArray(chartData.labels) || chartData.labels.length === 0)) {
      console.error('Chart data is missing labels for a chart type that requires them:', {
        chartType: chart.type,
        labels: chartData.labels
      });
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: isMobile ? 300 : 400 }}>
          <Typography variant="body1" color="error" sx={{ fontSize: isMobile ? '0.875rem' : '1rem', mb: 2 }}>
            Chart is missing axis labels
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem', mb: 2, textAlign: 'center', maxWidth: '80%' }}>
            Please edit the chart and select valid X-axis columns.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleEdit}
            startIcon={<EditIcon />}
            size="small"
          >
            Edit Chart
          </Button>
        </Box>
      );
    }
    
    const chartProps = {
      data: chartData,
      options: {
        ...chartOptions,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          ...chartOptions.plugins,
          legend: {
            ...chartOptions.plugins?.legend,
            labels: {
              ...chartOptions.plugins?.legend?.labels,
              font: {
                ...chartOptions.plugins?.legend?.labels?.font,
                size: isMobile ? 10 : (chartOptions.plugins?.legend?.labels?.font?.size || 12)
              }
            }
          }
        }
      },
      height: fullscreen ? window.innerHeight - 200 : (isMobile ? 300 : 400)
    };
    
    try {
      // Render the appropriate chart component based on chart type
      switch (chart.type) {
        case 'bar':
          return <Bar {...chartProps} />;
        case 'line':
          return <Line {...chartProps} />;
        case 'pie':
          return <Pie {...chartProps} />;
        case 'doughnut':
          return <Doughnut {...chartProps} />;
        case 'scatter':
          return <Scatter {...chartProps} />;
        case 'bubble':
          return <Bubble {...chartProps} />;
        case 'radar':
          return <Radar {...chartProps} />;
        case 'polarArea':
          return <PolarArea {...chartProps} />;
        default:
          console.error('Unsupported chart type:', chart.type);
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <Typography variant="body1" color="error">
                Unsupported chart type: {chart.type}
              </Typography>
            </Box>
          );
      }
    } catch (error) {
      console.error('Error rendering chart component:', error);
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1" color="error">
            Error rendering chart: {error.message}
          </Typography>
        </Box>
      );
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    navigate('/charts');
  };
  
  // Handle manual retry
  const handleRetry = () => {
    console.log('Manual retry initiated by user');
    setLoading(true);
    setError(null);
    // Force a fresh fetch with a new timestamp
    const fetchWithNewTimestamp = async () => {
      try {
        const timestamp = new Date().getTime();
        console.log(`Manual retry: Fetching chart with ID: ${id} at ${timestamp}`);
        
        const res = await axios.get(`/api/charts/${id}`, {
          headers: { 
            'x-auth-token': token,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          params: { _t: timestamp, forceRefresh: true },
          timeout: 30000 // Extended timeout for manual retry
        });
        
        if (!res.data) {
          throw new Error('No data received from server');
        }
        
        setChart(res.data);
        const { data, options } = formatChartData(res.data, isDarkMode);
        setChartData(data);
        setChartOptions(options);
        setLoading(false);
      } catch (err) {
        console.error('Manual retry failed:', err);
        setError(`Manual retry failed: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };
    
    fetchWithNewTimestamp();
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/charts')}
          >
            Back to Charts
          </Button>
          {renderConnectionStatus()}
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading chart data...
          </Typography>
          {connectionStatus === 'unstable' && (
            <Alert severity="warning" sx={{ mt: 2, maxWidth: 500 }}>
              Connection is unstable. Data may take longer to load.
            </Alert>
          )}
          {connectionStatus === 'disconnected' && (
            <Alert severity="error" sx={{ mt: 2, maxWidth: 500 }}>
              Connection to server lost. Attempting to reconnect...
            </Alert>
          )}
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Charts
          </Button>
          {renderConnectionStatus()}
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <Alert severity="error" sx={{ width: '100%', maxWidth: 600, mb: 2 }}>
            {error}
          </Alert>
          {connectionStatus === 'disconnected' && (
            <Alert severity="warning" sx={{ width: '100%', maxWidth: 600, mb: 2 }}>
              Connection to server lost. Please check your network connection.
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Back to Charts
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
            >
              Try Again
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }
  
  if (!chart) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/charts')}
          >
            Back to Charts
          </Button>
          {renderConnectionStatus()}
        </Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          Chart not found
        </Alert>
        {connectionStatus === 'unstable' || connectionStatus === 'disconnected' ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Connection issues detected. The chart may not be available due to network problems.
          </Alert>
        ) : null}
      </Container>
    );
  }
  
  return (
    <Container maxWidth={fullscreen ? false : "lg"} sx={{ mt: 4, mb: 4, px: fullscreen ? 4 : (isMobile ? 1 : 2) }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between', 
        mb: 3 
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          mb: isMobile ? 2 : 0,
          width: isMobile ? '100%' : 'auto'
        }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/charts')}
            sx={{ 
              ...responsiveStyles.buttonStyles(theme, isDarkMode).base,
              mr: isMobile ? 0 : 2, 
              mb: isMobile ? 1 : 0, 
              width: isMobile ? '100%' : 'auto' 
            }}
            size={isMobile ? 'small' : 'medium'}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
            <Typography variant={isMobile ? "h5" : "h4"} component="h1" sx={{ mr: 1 }}>
              {chart.title}
            </Typography>
            <Chip 
              icon={renderChartTypeIcon(chart.type)} 
              label={chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} 
              color="primary" 
              size="small" 
              sx={{ ml: 1 }}
            />
            {renderConnectionStatus()}
          </Box>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          width: isMobile ? '100%' : 'auto'
        }}>
          <Tooltip title="Toggle Fullscreen">
            <IconButton 
              onClick={toggleFullscreen} 
              size={isMobile ? 'small' : 'medium'}
              sx={responsiveStyles.buttonStyles(theme, isDarkMode).iconButton}
            >
              <FullscreenIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download as PNG">
            <IconButton 
              onClick={handleDownloadPNG} 
              size={isMobile ? 'small' : 'medium'}
              sx={responsiveStyles.buttonStyles(theme, isDarkMode).iconButton}
            >
              <DownloadIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download as PDF">
            <IconButton 
              onClick={handleDownloadPDF} 
              size={isMobile ? 'small' : 'medium'}
              sx={responsiveStyles.buttonStyles(theme, isDarkMode).iconButton}
            >
              <DownloadIcon sx={{ transform: 'rotate(180deg)' }} fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={handleRefresh} 
              size={isMobile ? 'small' : 'medium'}
              sx={responsiveStyles.buttonStyles(theme, isDarkMode).iconButton}
            >
              <RefreshIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Tooltip>
          
          <IconButton
            aria-label="more"
            id="chart-menu-button"
            aria-controls={open ? 'chart-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleMenuClick}
            size={isMobile ? 'small' : 'medium'}
            sx={responsiveStyles.buttonStyles(theme, isDarkMode).iconButton}
          >
            <MoreVertIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <Menu
            id="chart-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'chart-menu-button',
            }}
          >
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Chart</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Chart</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {chart.description && (
        <Typography 
          variant="body1" 
          color="textSecondary" 
          sx={{ 
            mb: 3,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        >
          {chart.description}
        </Typography>
      )}
      
      <Paper 
        sx={{ 
          ...responsiveStyles.paperCard(theme, isDarkMode),
          p: isMobile ? 2 : 3, 
          mb: 3, 
          height: fullscreen ? `calc(100vh - 200px)` : 'auto',
          transition: 'all 0.3s ease'
        }}
        elevation={fullscreen ? 4 : 1}
      >
        <Box 
          sx={{ 
            height: fullscreen ? '100%' : (isMobile ? 300 : 400), 
            position: 'relative' 
          }} 
          className="chart-container"
        >
          {renderChartComponent()}
        </Box>
      </Paper>
      
      {/* AI Insights Panel */}
      {!fullscreen && <AIInsightPanel chartId={id} token={token} />}
      
      {!fullscreen && (
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ ...responsiveStyles.paperCard(theme, isDarkMode), p: isMobile ? 1.5 : 2 }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
              >
                Chart Configuration
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>{renderChartTypeIcon(chart.type)}</ListItemIcon>
                  <ListItemText 
                    primary="Chart Type" 
                    secondary={chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} 
                  />
                </ListItem>
                <Divider />
                {!['pie', 'doughnut', 'polarArea'].includes(chart.type) && chart.config?.xAxis && (
                  <ListItem>
                    <ListItemText 
                      primary="X-Axis Columns" 
                      secondary={chart.config.xAxis.join(', ')} 
                    />
                  </ListItem>
                )}
                {chart.config?.yAxis && (
                  <ListItem>
                    <ListItemText 
                      primary="Y-Axis Columns" 
                      secondary={chart.config.yAxis.join(', ')} 
                    />
                  </ListItem>
                )}
                {chart.config?.categoryField && (
                  <ListItem>
                    <ListItemText 
                      primary="Category Field" 
                      secondary={chart.config.categoryField} 
                    />
                  </ListItem>
                )}
                {chart.type === 'bubble' && chart.config?.sizeField && (
                  <ListItem>
                    <ListItemText 
                      primary="Size Field" 
                      secondary={chart.config.sizeField} 
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ ...responsiveStyles.paperCard(theme, isDarkMode), p: isMobile ? 1.5 : 2 }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
              >
                Data Source
              </Typography>
              <List dense>
                {chart.file && (
                  <ListItem>
                    <ListItemIcon><TableChartIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Excel File" 
                      secondary={chart.file.originalName || chart.file.name} 
                    />
                  </ListItem>
                )}
                {chart.excelData && (
                  <ListItem>
                    <ListItemText 
                      primary="Sheet" 
                      secondary={chart.excelData.sheetName} 
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText 
                    primary="Last Updated" 
                    secondary={new Date(chart.updatedAt).toLocaleString()} 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ChartViewer;