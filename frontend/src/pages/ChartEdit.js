import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon,
  TableChart as TableChartIcon,
  DonutLarge as DonutLargeIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  ScatterPlot as ScatterPlotIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import AxisSelect from '../components/AxisSelect';
import SingleAxisSelect from '../components/SingleAxisSelect';
import { useIsDarkMode, formatChartPreviewData, renderChartPreview as renderChartPreviewUtil } from '../utils/chartUtils';
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

const ChartEdit = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { id } = useParams();
  
  // Responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Chart data state
  const [chart, setChart] = useState(null);
  const [files, setFiles] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [dataColumns, setDataColumns] = useState([]);
  
  // Chart configuration state
  const [chartType, setChartType] = useState('');
  const [chartTitle, setChartTitle] = useState('');
  const [chartDescription, setChartDescription] = useState('');
  const [xAxisColumns, setXAxisColumns] = useState([]);
  const [yAxisColumns, setYAxisColumns] = useState([]);
  const [categoryColumn, setCategoryColumn] = useState('');
  const [sizeColumn, setSizeColumn] = useState('');
  
  // State for dynamic axis selection
  const [tempXAxisColumn, setTempXAxisColumn] = useState('');
  const [tempYAxisColumn, setTempYAxisColumn] = useState('');
  
  // Chart preview state
  const [previewData, setPreviewData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Chart colors
  const [chartColors, setChartColors] = useState([
    '#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#00BCD4', '#FF9800', '#795548'
  ]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5, 
        when: "beforeChildren", 
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  // Fetch chart data on component mount
  useEffect(() => {
    const fetchChartData = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id || id.trim() === '') {
          setError('Invalid chart ID. Please check the URL and try again.');
          setLoading(false);
          return;
        }
        
        // Fetch chart data
        const response = await api.get(`/api/charts/${id}`);
        
        const chart = response.data;
        if (!chart) {
          throw new Error('No chart data received from server.');
        }
        
        // Check if data source references exist before proceeding
        if (!chart.excelData || !chart.excelData._id) {
          console.error('Excel data reference is missing in chart');
          setError('Chart data source information is missing. Cannot load chart.');
          setLoading(false);
          return;
        }
        
        // Set chart data
        setChart(chart);
        setChartTitle(chart.title || 'Untitled Chart');
        setChartDescription(chart.description || '');
        setChartType(chart.type || 'bar');
        
        if (chart.config) {
          setXAxisColumns(Array.isArray(chart.config.xAxis) && chart.config.xAxis.length > 0 ? chart.config.xAxis : []);
          setYAxisColumns(Array.isArray(chart.config.yAxis) ? chart.config.yAxis : []);
          setCategoryColumn(chart.config.categoryField || '');
          setSizeColumn(chart.config.sizeField || '');
        } else {
          console.warn('Chart configuration is missing or invalid');
          setXAxisColumns([]);
          setYAxisColumns([]);
        }
        
        // Fetch files for data source selection
        const filesResponse = await api.get('/api/uploads');
        setFiles(filesResponse.data);
        
        // Fetch Excel data for the selected file
        if (chart.file && chart.file._id) {
          const excelResponse = await api.get(`/api/uploads/${chart.file._id}/data`);
          if (excelResponse.data && excelResponse.data.sheets) {
            setExcelData(excelResponse.data.sheets);
          }
        }
        
        // Fetch column data
        const excelDataId = chart.excelData._id;
        const columnsResponse = await api.get(`/api/uploads/data/${excelDataId}`);
        
        if (columnsResponse.data && Array.isArray(columnsResponse.data.columns)) {
          setDataColumns(columnsResponse.data.columns.map((col, index) => ({
            id: index,
            name: col.name || `Column ${index}`,
            type: col.dataType || 'unknown',
            isNumericField: Boolean(col.isNumericField),
            uniqueValues: Array.isArray(col.uniqueValues) ? col.uniqueValues : []
          })));
        } else {
          throw new Error('Invalid column data format received from server');
        }
        
        // Generate chart preview
        generateChartPreview();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        
        if (retryCount < 3) {
          const retryDelay = 2000 * Math.pow(2, retryCount);
          setError(`Attempting to reconnect... (${retryCount + 1}/3)`);
          setTimeout(() => {
            fetchChartData(retryCount + 1);
          }, retryDelay);
        } else {
          const errorMessage = err.userMessage || 
                              err.response?.data?.message || 
                              (err.message === 'Network Error' ? 
                                'Network connection issue. Please check your internet connection.' : 
                                'Failed to load chart. Please try refreshing the page or return to the charts list.');
          setError(errorMessage);
          setLoading(false);
        }
      }
    };
    
    fetchChartData();
  }, [id]);
  
  // Update chart options when title changes or y-axis columns change
  useEffect(() => {
    const textColor = isDarkMode ? '#FFFFFF' : '#333333';
    
    // Get Y-axis label from selected columns
    const yAxisLabel = yAxisColumns.length > 0 ? yAxisColumns.join(', ') : 'Y Axis';
    
    setChartOptions({
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: {
              size: 13,
              weight: 'normal'
            },
            padding: 15,
            usePointStyle: true,
            boxWidth: 8
          },
          display: true // Always show legend for better readability
        },
        title: {
          display: true,
          text: chartTitle || 'Chart Preview',
          color: textColor,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          titleColor: isDarkMode ? '#FFFFFF' : '#333333',
          bodyColor: isDarkMode ? '#FFFFFF' : '#333333',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 4,
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y;
              }
              return label;
            }
          }
        }
      },
      scales: chartType === 'radar' ? {} : {
        x: {
          display: !['pie', 'doughnut', 'polarArea'].includes(chartType),
          title: {
            display: !['pie', 'doughnut', 'polarArea'].includes(chartType),
            text: xAxisColumns.join(', '),
            color: textColor,
            font: {
              size: 13,
              weight: 'normal'
            },
            padding: {
              top: 10,
              bottom: 0
            }
          },
          grid: {
            display: !['pie', 'doughnut', 'polarArea'].includes(chartType),
            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            tickColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
          },
          ticks: {
            color: textColor,
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          display: !['pie', 'doughnut', 'polarArea'].includes(chartType),
          title: {
            display: !['pie', 'doughnut', 'polarArea'].includes(chartType),
            text: yAxisLabel,
            color: textColor,
            font: {
              size: 13,
              weight: 'normal'
            },
            padding: {
              top: 0,
              bottom: 10
            }
          },
          grid: {
            display: !['pie', 'doughnut', 'polarArea'].includes(chartType),
            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            tickColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
          },
          ticks: {
            color: textColor,
            font: {
              size: 11
            }
          }
        }
      }
    });
  }, [chartTitle, isDarkMode, xAxisColumns, yAxisColumns, chartType]);

  // Generate chart preview
  const generateChartPreview = async (retryCount = 0) => {
    try {
      setPreviewLoading(true);
      setError(null);
      
      if (!chart || !chart.excelData || !chart.excelData._id) {
        setError('Chart data is missing or invalid.');
        setPreviewLoading(false);
        return;
      }
      
      if (!chartType) {
        setError('No chart type selected.');
        setPreviewLoading(false);
        return;
      }
      
      // Log the current configuration for debugging
      console.log('Starting chart preview generation with:', {
        chartType,
        xAxisColumns,
        yAxisColumns,
        categoryColumn,
        sizeColumn
      });
      
      // Check if we need X-axis columns for this chart type
      const requiresXAxis = !['pie', 'doughnut', 'polarArea'].includes(chartType);
      if (requiresXAxis && (!xAxisColumns || !Array.isArray(xAxisColumns) || xAxisColumns.length === 0)) {
        console.error('Cannot generate preview: missing or invalid X-axis columns', xAxisColumns);
        setError('Please select at least one X-axis column for this chart type.');
        setPreviewLoading(false);
        return;
      }
      
      if (!yAxisColumns || !Array.isArray(yAxisColumns) || yAxisColumns.length === 0) {
        console.error('Cannot generate preview: missing or invalid Y-axis columns', yAxisColumns);
        setError('Please select at least one Y-axis column.');
        setPreviewLoading(false);
        return;
      }
      
      // Additional validation for specific chart types
      if (chartType === 'bubble' && !sizeColumn) {
        setError('Bubble charts require a Size field to determine bubble size. Please select a numeric field.');
        setPreviewLoading(false);
        return;
      }
      
      if (['scatter', 'bubble'].includes(chartType) && !categoryColumn) {
        setError(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} charts require a Category field to group data points. Please select a category field.`);
        setPreviewLoading(false);
        return;
      }
      
      const config = {
        type: chartType,
        title: chartTitle,
        description: chartDescription,
        xAxis: xAxisColumns,
        yAxis: yAxisColumns,
        categoryField: categoryColumn || undefined,
        sizeField: sizeColumn || undefined
      };
      
      console.log('Generating preview with config:', config);
      
      const response = await api.post('/api/charts/preview', {
        excelDataId: chart.excelData._id,
        config
      });
      
      const processedData = response.data;
      
      // Enhanced validation and logging for debugging
      console.log('Received processed data from server:', processedData);
      
      if (!processedData) {
        throw new Error('No data received from server. Please try again.');
      }
      
      if (!processedData.datasets) {
        console.error('Missing datasets in processed data:', processedData);
        throw new Error('Chart data is missing datasets. Please check your axis selections.');
      }
      
      if (!Array.isArray(processedData.datasets)) {
        console.error('Datasets is not an array:', processedData.datasets);
        throw new Error('The datasets property is not an array');
      }
      
      if (processedData.datasets.length === 0) {
        console.error('Empty datasets array in processed data:', processedData);
        throw new Error('Chart data contains empty datasets. Please check your axis selections.');
      }
      
      // Validate datasets have data
      const hasValidData = processedData.datasets.some(dataset => 
        dataset && dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0
      );
      
      if (!hasValidData) {
        console.error('No valid data in datasets:', processedData.datasets);
        throw new Error('No valid data found for the selected columns. Please check your selections.');
      }
      
      // Validate labels for non-scatter/bubble charts
      if (!['scatter', 'bubble'].includes(chartType)) {
        if (!processedData.labels) {
          console.error('Missing labels in processed data for chart type:', chartType);
          throw new Error('Chart data is missing labels. Please check your X-axis selection.');
        }
        
        if (!Array.isArray(processedData.labels)) {
          console.error('Labels is not an array:', processedData.labels);
          throw new Error('The labels property is not an array');
        }
        
        if (processedData.labels.length === 0) {
          console.error('Empty labels array in processed data');
          throw new Error('No labels found in the chart data. Please check your X-axis selection.');
        }
      }
      
      // Use the formatChartPreviewData utility function to format the chart data
      const chartData = formatChartPreviewData(processedData, chartType, chartColors);
      
      if (!chartData) {
        console.error('Failed to format chart data with:', { processedData, chartType, chartColors });
        throw new Error('Failed to format chart data. Please check your selections and try again.');
      }
      
      console.log('Formatted chart data:', chartData);
      setPreviewData(chartData);
      setPreviewLoading(false);
    } catch (err) {
      console.error('Error generating chart preview:', err);
      if (retryCount < 3) {
        const retryDelay = 2000 * (retryCount + 1);
        setError(`Attempting to reconnect... (${retryCount + 1}/3)`);
        setTimeout(() => {
          generateChartPreview(retryCount + 1);
        }, retryDelay);
      } else {
        const errorMessage = err.userMessage || 
                            err.response?.data?.message || 
                            (err.message === 'Network Error' ? 
                              'Network connection issue. Please check your internet connection.' : 
                              'Failed to load chart data. Please try refreshing the page or selecting different data.');
        setError(errorMessage);
        setPreviewLoading(false);
      }
    }
  };

  // Handle axis column changes
  const handleXAxisChange = (event) => {
    setTempXAxisColumn(event.target.value);
    if (event.target.value && !xAxisColumns.includes(event.target.value)) {
      addAxisToChart('x', event.target.value);
    }
  };

  const handleYAxisChange = (event) => {
    setTempYAxisColumn(event.target.value);
    if (event.target.value && !yAxisColumns.includes(event.target.value)) {
      addAxisToChart('y', event.target.value);
    }
  };

  const addAxisToChart = (axisType, column) => {
    if (!column) return;
    
    if (axisType === 'x') {
      if (!xAxisColumns.includes(column)) {
        setXAxisColumns([...xAxisColumns, column]);
        setTempXAxisColumn('');
        generateChartPreview();
      }
    } else if (axisType === 'y') {
      if (!yAxisColumns.includes(column)) {
        setYAxisColumns([...yAxisColumns, column]);
        setTempYAxisColumn('');
        generateChartPreview();
      }
    }
  };

  const removeAxisFromChart = (axisType, column) => {
    if (axisType === 'x') {
      setXAxisColumns(xAxisColumns.filter(c => c !== column));
      generateChartPreview();
    } else if (axisType === 'y') {
      setYAxisColumns(yAxisColumns.filter(c => c !== column));
      generateChartPreview();
    }
  };

  const handleCategoryChange = (event) => {
    setCategoryColumn(event.target.value);
    generateChartPreview();
  };

  const handleSizeChange = (event) => {
    setSizeColumn(event.target.value);
    generateChartPreview();
  };

  // Handle chart type change
  const handleChartTypeChange = (type) => {
    setChartType(type);
    
    // Reset axis selections for certain chart types
    if (['pie', 'doughnut', 'polarArea'].includes(type)) {
      setXAxisColumns([]);
    } else if (['scatter', 'bubble'].includes(type) && !categoryColumn) {
      // For scatter and bubble charts, ensure we have a category column
      const firstNonNumericColumn = dataColumns.find(col => !col.isNumericField);
      if (firstNonNumericColumn) {
        setCategoryColumn(firstNonNumericColumn.name);
      }
      
      // For bubble charts, ensure we have a size column
      if (type === 'bubble' && !sizeColumn) {
        const firstNumericColumn = dataColumns.find(col => col.isNumericField && 
          col.name !== xAxisColumns[0] && 
          !yAxisColumns.includes(col.name));
        if (firstNumericColumn) {
          setSizeColumn(firstNumericColumn.name);
        }
      }
    }
    
    // Generate preview with the new chart type
    generateChartPreview();
  };

  // Save updated chart
  const saveChart = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Validate chart title
      if (!chartTitle || chartTitle.trim() === '') {
        setError('Please enter a chart title.');
        setSaving(false);
        return;
      }
      
      // Validate chart type
      if (!chartType) {
        setError('Please select a chart type.');
        setSaving(false);
        return;
      }
      
      // Validate data source
      if (!chart || !chart.excelData || !chart.excelData._id) {
        setError('Chart data source is missing or invalid.');
        setSaving(false);
        return;
      }
      
      // Validate axis selections based on chart type
      const requiresXAxis = !['pie', 'doughnut', 'polarArea'].includes(chartType);
      if (requiresXAxis && (!xAxisColumns || xAxisColumns.length === 0)) {
        setError('Please select at least one X-axis column for this chart type.');
        setSaving(false);
        return;
      }
      
      if (!yAxisColumns || yAxisColumns.length === 0) {
        setError('Please select at least one Y-axis column.');
        setSaving(false);
        return;
      }
      
      // Additional validation for specific chart types
      if (chartType === 'bubble' && !sizeColumn) {
        setError('Bubble charts require a Size field. Please select a numeric field for the size.');
        setSaving(false);
        return;
      }
      
      if (['scatter', 'bubble'].includes(chartType) && !categoryColumn) {
        setError(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} charts require a Category field. Please select a category field.`);
        setSaving(false);
        return;
      }
      
      // Construct chart data object
      const chartData = {
        title: chartTitle,
        description: chartDescription,
        type: chartType,
        config: {
          xAxis: xAxisColumns,
          yAxis: yAxisColumns,
          categoryField: categoryColumn || undefined,
          sizeField: sizeColumn || undefined
        },
        excelData: chart.excelData._id,
        file: chart.file?._id
      };
      
      // Update the chart
      await api.put(`/api/charts/${id}`, chartData);
      
      setSuccessMessage('Chart updated successfully! Redirecting to chart view...');
      
      // Redirect to chart view after a short delay
      setTimeout(() => {
        navigate(`/charts/${id}`);
      }, 1500);
      
      setSaving(false);
    } catch (err) {
      console.error('Error saving chart:', err);
      const errorMessage = err.userMessage || 
                          err.response?.data?.message || 
                          (err.message === 'Network Error' ? 
                            'Network connection issue. Please check your internet connection.' : 
                            'Failed to save chart. Please try again.');
      setError(errorMessage);
      setSaving(false);
    }
  };

  // Render chart type icon
  const renderChartTypeIcon = (type) => {
    switch (type) {
      case 'bar':
        return <BarChartIcon />;
      case 'line':
        return <TimelineIcon />;
      case 'pie':
        return <PieChartIcon />;
      case 'doughnut':
        return <DonutLargeIcon />;
      case 'scatter':
        return <ScatterPlotIcon />;
      case 'bubble':
        return <BubbleChartIcon />;
      case 'radar':
        return <RadioButtonCheckedIcon />;
      case 'polarArea':
        return <RadioButtonCheckedIcon />;
      default:
        return <BarChartIcon />;
    }
  };

  // Use the renderChartPreview function from chartUtils.js
  const renderChartPreview = () => {
    return renderChartPreviewUtil(chartType, previewData, chartOptions, generateChartPreview);
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading chart data...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error && !chart) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/charts')}
          >
            Back to Charts
          </Button>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <Alert severity="error" sx={{ width: '100%', maxWidth: 600, mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/charts')}
            >
              Back to Charts
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 max-w-7xl"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-card p-6 md:p-8`} variants={itemVariants}>
        <motion.div className="flex items-center mb-6" variants={itemVariants}>
          <button
            onClick={() => navigate('/charts')}
            className="flex items-center text-primary-600 hover:text-primary-700 transition-colors mr-4 font-medium"
          >
            <ArrowBackIcon className="mr-1" />
            Back to Charts
          </button>
          <h1 className={`text-2xl md:text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} font-inter`}>
            Edit Chart
          </h1>
        </motion.div>
        
        {/* Error/Success message display */}
        {(error || successMessage) && (
          <motion.div 
            variants={itemVariants}
            className="mb-6"
          >
            <div className={`${successMessage ? 
              'bg-green-50 border-green-200 text-green-700' : 
              'bg-red-50 border-red-200 text-red-700'} 
              border px-4 py-3 rounded-lg flex items-start shadow-lg`}>
              <div className="flex-shrink-0 mr-2 mt-0.5">
                {successMessage ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-grow">
                {successMessage || error}
              </div>
              {successMessage && (
                <div className="ml-2">
                  <CircularProgress size={20} color="inherit" />
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        <Grid container spacing={4}>
          {/* Left column - Chart configuration */}
          <Grid item xs={12} md={5} lg={4}>
            <motion.div variants={itemVariants}>
              <Paper className="p-6 rounded-xl shadow-sm mb-6" sx={{ bgcolor: isDarkMode ? 'background.paper' : 'white' }}>
                <Typography variant="h6" className="mb-4 font-semibold">
                  Chart Information
                </Typography>
                
                <TextField
                  label="Chart Title"
                  variant="outlined"
                  fullWidth
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  margin="normal"
                  required
                  error={!chartTitle}
                  helperText={!chartTitle ? 'Please enter a chart title' : ''}
                />
                
                <TextField
                  label="Chart Description (Optional)"
                  variant="outlined"
                  fullWidth
                  value={chartDescription}
                  onChange={(e) => setChartDescription(e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Paper>
              
              <Paper className="p-6 rounded-xl shadow-sm mb-6" sx={{ bgcolor: isDarkMode ? 'background.paper' : 'white' }}>
                <Typography variant="h6" className="mb-4 font-semibold">
                  Chart Type
                </Typography>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {['bar', 'line', 'pie', 'doughnut', 'scatter', 'bubble', 'radar', 'polarArea'].map((type) => (
                    <Tooltip key={type} title={type.charAt(0).toUpperCase() + type.slice(1)} placement="top">
                      <Paper 
                        elevation={chartType === type ? 4 : 1}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${chartType === type ? 
                          'ring-2 ring-primary-500 bg-primary-50' : 
                          'hover:bg-gray-50'}`}
                        onClick={() => handleChartTypeChange(type)}
                        sx={{
                          bgcolor: chartType === type ? 
                            (isDarkMode ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)') : 
                            (isDarkMode ? 'background.paper' : 'white'),
                          border: chartType === type ? 
                            '1px solid rgba(25, 118, 210, 0.5)' : 
                            '1px solid rgba(0, 0, 0, 0.12)'
                        }}
                      >
                        <Box display="flex" flexDirection="column" alignItems="center">
                          {renderChartTypeIcon(type)}
                          <Typography variant="caption" sx={{ mt: 1 }}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Typography>
                        </Box>
                      </Paper>
                    </Tooltip>
                  ))}
                </div>
              </Paper>
              
              <Paper className="p-6 rounded-xl shadow-sm" sx={{ bgcolor: isDarkMode ? 'background.paper' : 'white' }}>
                <Typography variant="h6" className="mb-4 font-semibold">
                  Data Configuration
                </Typography>
                
                {/* X-Axis Selection */}
                {!['pie', 'doughnut', 'polarArea'].includes(chartType) && (
                  <AxisSelect
                    axisType="x"
                    label="X-Axis Columns"
                    value={tempXAxisColumn}
                    onChange={handleXAxisChange}
                    columns={dataColumns}
                    selectedColumns={xAxisColumns}
                    onAdd={(column) => addAxisToChart('x', column)}
                    onRemove={(column) => removeAxisFromChart('x', column)}
                    updateMode="immediate"
                    chartType={chartType}
                    required={!['pie', 'doughnut', 'polarArea'].includes(chartType)}
                  />
                )}
                
                {/* Y-Axis Selection */}
                <AxisSelect
                  axisType="y"
                  label="Y-Axis Columns"
                  value={tempYAxisColumn}
                  onChange={handleYAxisChange}
                  columns={dataColumns}
                  selectedColumns={yAxisColumns}
                  onAdd={(column) => addAxisToChart('y', column)}
                  onRemove={(column) => removeAxisFromChart('y', column)}
                  updateMode="immediate"
                  filterFn={(column) => column.isNumericField && !yAxisColumns.includes(column.name)}
                  chartType={chartType}
                  required={true}
                />
                
                {/* Category Field Selection for Scatter/Bubble */}
                {['scatter', 'bubble'].includes(chartType) && (
                  <SingleAxisSelect
                    id="category"
                    label="Category Field"
                    value={categoryColumn}
                    onChange={handleCategoryChange}
                    columns={dataColumns}
                    chartType={chartType}
                    required={true}
                  />
                )}
                
                {/* Size Field Selection for Bubble */}
                {chartType === 'bubble' && (
                  <SingleAxisSelect
                    id="size"
                    label="Size Field"
                    value={sizeColumn}
                    onChange={handleSizeChange}
                    columns={dataColumns}
                    filterFn={(column) => column.isNumericField}
                    chartType={chartType}
                    required={true}
                  />
                )}
              </Paper>
            </motion.div>
          </Grid>
          
          {/* Right column - Chart preview */}
          <Grid item xs={12} md={7} lg={8}>
            <motion.div variants={itemVariants}>
              <Paper className="p-6 rounded-xl shadow-sm mb-6" sx={{ bgcolor: isDarkMode ? 'background.paper' : 'white' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" className="font-semibold">
                    Chart Preview
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={generateChartPreview}
                    disabled={previewLoading}
                    size="small"
                  >
                    Refresh Preview
                  </Button>
                </Box>
                
                <Box height={400} position="relative">
                  {previewLoading ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Generating preview...
                      </Typography>
                    </Box>
                  ) : previewData ? (
                    renderChartPreview()
                  ) : (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body1" color="textSecondary">
                        No preview available. Please configure your chart and click "Refresh Preview".
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
              
              <Paper className="p-6 rounded-xl shadow-sm" sx={{ bgcolor: isDarkMode ? 'background.paper' : 'white' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" className="font-semibold">
                    Data Source
                  </Typography>
                  <Chip 
                    label={chart?.file?.originalName || chart?.file?.name || 'Unknown file'}
                    color="primary"
                    variant="outlined"
                    icon={<TableChartIcon />}
                  />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Excel Sheet:
                    </Typography>
                    <Typography variant="body1">
                      {chart?.excelData?.sheetName || 'Unknown sheet'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Available Columns:
                    </Typography>
                    <Typography variant="body1">
                      {dataColumns.length}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
        
        <motion.div 
          className="flex justify-between mt-8 pt-4 border-t border-gray-200"
          variants={itemVariants}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/charts/${id}`)}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveChart}
            disabled={saving || !chartTitle || yAxisColumns.length === 0 || 
              (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0)}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ChartEdit;