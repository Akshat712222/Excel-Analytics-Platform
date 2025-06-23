import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormHelperText,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Chip,
  Switch,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import AxisSelect from '../components/AxisSelect';
import SingleAxisSelect from '../components/SingleAxisSelect';
import { motion } from 'framer-motion';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon,
  TableChart as TableChartIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ColorLens as ColorLensIcon
} from '@mui/icons-material';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import { formatChartPreviewData, renderChartPreview } from '../utils/chartUtils';
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

const ChartCreator = ({ isEditMode }) => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select Data Source', 'Choose Chart Type', 'Configure Chart', 'Preview & Save'];
  
  // Data source state
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [excelData, setExcelData] = useState([]);
  const [selectedExcelData, setSelectedExcelData] = useState('');
  const [dataColumns, setDataColumns] = useState([]);
  
  // Chart configuration state
  const [chartType, setChartType] = useState('bar');
  const [chartTitle, setChartTitle] = useState('');
  const [chartDescription, setChartDescription] = useState('');
  const [xAxisColumns, setXAxisColumns] = useState([]);
  const [yAxisColumns, setYAxisColumns] = useState([]);
  const [categoryColumn, setCategoryColumn] = useState('');
  const [sizeColumn, setSizeColumn] = useState('');
  const [aggregationMethod, setAggregationMethod] = useState('sum'); // Data aggregation method
  
  // State for dynamic axis selection
  const [tempXAxisColumn, setTempXAxisColumn] = useState('');
  const [tempYAxisColumn, setTempYAxisColumn] = useState('');
  const [axisUpdateMode, setAxisUpdateMode] = useState('immediate'); // 'immediate' or 'manual'

  // Chart customization state
  const [chartColors, setChartColors] = useState([
    '#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#00BCD4', '#FF9800', '#795548'
  ]);
  const [chartOptions, setChartOptions] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  
  // Always call useParams unconditionally to follow React Hooks rules
  const params = useParams();
  // Then conditionally use the id parameter
  const id = isEditMode ? params.id : null;

  // Fetch user's files on component mount with retry functionality
  useEffect(() => {
    const fetchFiles = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/uploads');
        setFiles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching files:', err);
        if (retryCount < 3) {
          setError(`Attempting to reconnect... (${retryCount + 1}/3)`);
          setTimeout(() => {
            fetchFiles(retryCount + 1);
          }, 2000);
        } else {
          const errorMessage = err.response?.data?.message || 
                              (err.message === 'Network Error' ? 
                                'Network connection issue. Please check your internet connection.' : 
                                'Failed to load files. Please try refreshing the page.');
          setError(errorMessage);
          setLoading(false);
        }
      }
    };
    
    fetchFiles();
  }, []);
  
  // Generate chart preview function
  const generateChartPreview = async (retryCount = 0, forcedExcelDataId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use forcedExcelDataId if provided (for edit mode fallback)
      const excelDataId = forcedExcelDataId || selectedExcelData;
      
      if (!excelDataId) {
        setError('No data source selected. Please select an Excel sheet first.');
        setLoading(false);
        return;
      }
      
      if (!chartType) {
        setError('No chart type selected. Please select a chart type first.');
        setLoading(false);
        return;
      }
      
      // Check if we need X-axis columns for this chart type
      const requiresXAxis = !['pie', 'doughnut', 'polarArea'].includes(chartType);
      if (requiresXAxis && (!xAxisColumns || xAxisColumns.length === 0)) {
        setError('Please select at least one X-axis column for this chart type.');
        setLoading(false);
        return;
      }
      
      if (yAxisColumns.length === 0) {
        setError('Please select at least one Y-axis column.');
        setLoading(false);
        return;
      }
      
      // Additional validation for specific chart types
      if (chartType === 'bubble' && !sizeColumn) {
        setError('Bubble charts require a Size field to determine bubble size. Please select a numeric field.');
        setLoading(false);
        return;
      }
      
      if (['scatter', 'bubble'].includes(chartType) && !categoryColumn) {
        setError(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} charts require a Category field to group data points. Please select a category field.`);
        setLoading(false);
        return;
      }
      
      const config = {
        type: chartType,
        title: chartTitle,
        description: chartDescription,
        xAxis: xAxisColumns,
        yAxis: yAxisColumns,
        categoryField: categoryColumn || undefined,
        sizeField: sizeColumn || undefined,
        aggregationMethod: aggregationMethod || 'sum'
      };
      
      const response = await api.post('/api/charts/preview', {
        excelDataId: excelDataId, // Use the excelDataId variable instead of selectedExcelData
        config
      });
      
      const processedData = response.data;
      
      if (!processedData || !processedData.datasets || processedData.datasets.length === 0) {
        throw new Error('Invalid chart data received from server. The data may be empty or in an incorrect format.');
      }
      
      if (!['scatter', 'bubble'].includes(chartType) && 
          (!processedData.labels || processedData.labels.length === 0)) {
        throw new Error('No labels found in the chart data. Please check your X-axis selection.');
      }
      
      // Use the formatChartPreviewData utility function to format the chart data
      const chartData = formatChartPreviewData(processedData, chartType, chartColors);
      
      if (!chartData) {
        throw new Error('Failed to format chart data. Please check your selections and try again.');
      }
      
      setPreviewData(chartData);
      setLoading(false);
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
        setLoading(false);
      }
    }
  };

  // Fetch chart data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchChartData = async (retryCount = 0) => {
        try {
          setLoading(true);
          setError(null);
          
          if (!id || id.trim() === '') {
            setError('Invalid chart ID. Please check the URL and try again.');
            setLoading(false);
            return;
          }
          
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
          
          if (!chart.file || !chart.file._id) {
            console.warn('File reference is missing in chart data');
            // Continue anyway, but log the warning
          }
          
          // Set data source first to prevent race conditions
          const excelDataId = chart.excelData._id;
          const fileId = chart.file?._id || '';
          
          // Set file and excel data in sequence
          setSelectedFile(fileId);
          setSelectedExcelData(excelDataId);
          
          // Then set other chart properties
          setChartTitle(chart.title || 'Untitled Chart');
          setChartDescription(chart.description || '');
          setChartType(chart.type || 'bar');
          
          if (chart.config) {
            console.log('Loaded chart.config.xAxis:', chart.config.xAxis);
            setXAxisColumns(Array.isArray(chart.config.xAxis) && chart.config.xAxis.length > 0 ? chart.config.xAxis : []);
            setYAxisColumns(Array.isArray(chart.config.yAxis) ? chart.config.yAxis : []);
            setCategoryColumn(chart.config.categoryField || '');
            setSizeColumn(chart.config.sizeField || '');
            setAggregationMethod(chart.config.aggregationMethod || 'sum');
          } else {
            console.warn('Chart configuration is missing or invalid');
            setXAxisColumns([]);
            setYAxisColumns([]);
          }
          
          try {
            // Fetch column data directly using the ID we already validated
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
          } catch (columnsErr) {
            console.error('Error fetching columns:', columnsErr);
            setError(columnsErr.userMessage || 'Failed to fetch column data. Please try again.');
            setLoading(false);
            return;
          }
          
          setActiveStep(3);
          
          // Add a slightly longer delay to ensure all state updates have been processed
          setTimeout(() => {
            // Double-check that we still have the data source selected before generating preview
            if (selectedExcelData) {
              generateChartPreview(0);
            } else {
              console.error('Data source was not properly set before generating preview');
              // Try one more time with the ID we know is valid
              setSelectedExcelData(excelDataId);
              // Pass the excelDataId directly to generateChartPreview as a fallback
              setTimeout(() => generateChartPreview(0, excelDataId), 500);
            }
          }, 1000);
          
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
    }
  }, [isEditMode, id]);
  
  // Fetch Excel data when a file is selected
  useEffect(() => {
    if (!selectedFile) {
      setExcelData([]);
      setSelectedExcelData('');
      return;
    }
    
    const fetchExcelData = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        
        if (!selectedFile || selectedFile.trim() === '') {
          setError('Invalid file selection. Please select a valid Excel file.');
          setLoading(false);
          return;
        }
        
        const response = await api.get(`/api/uploads/${selectedFile}/data`);
        
        if (!response.data || !response.data.sheets) {
          throw new Error('Invalid data format received from server');
        }
        
        if (!Array.isArray(response.data.sheets) || response.data.sheets.length === 0) {
          setError('The selected Excel file contains no data sheets. Please select another file.');
          setExcelData([]);
          setLoading(false);
          return;
        }
        
        setExcelData(response.data.sheets);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching Excel data:', err);
        
        if (retryCount < 3) {
          const retryDelay = 2000 * Math.pow(2, retryCount);
          setError(`Attempting to reconnect... (${retryCount + 1}/3)`);
          setTimeout(() => {
            fetchExcelData(retryCount + 1);
          }, retryDelay);
        } else {
          const errorMessage = err.userMessage || 
                              err.response?.data?.message || 
                              (err.message === 'Network Error' ? 
                                'Network connection issue. Please check your internet connection.' : 
                                'Failed to load Excel data. The file may be corrupted or in an unsupported format.');
          setError(errorMessage);
          setLoading(false);
        }
      }
    };
    
    fetchExcelData();
  }, [selectedFile]);
  
  // Update data columns when Excel data is selected
  useEffect(() => {
    if (!selectedExcelData) {
      setDataColumns([]);
      return;
    }
    
    const fetchDataColumns = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        
        if (!selectedExcelData || selectedExcelData.trim() === '') {
          setError('Invalid data selection. Please select a valid Excel sheet.');
          setLoading(false);
          return;
        }
        
        const response = await api.get(`/api/uploads/data/${selectedExcelData}`);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        if (!response.data.columns || !Array.isArray(response.data.columns)) {
          setError('The selected data sheet has no column information. Please select another sheet.');
          setDataColumns([]);
          setLoading(false);
          return;
        }
        
        const columns = response.data.columns.map((col, index) => {
          if (!col || !col.name) {
            console.warn(`Column at index ${index} is missing name property`);
            return {
              id: index,
              name: `Column ${index}`,
              type: 'unknown',
              isNumericField: false,
              uniqueValues: []
            };
          }
          
          return {
            id: index,
            name: col.name,
            type: col.dataType || 'unknown',
            isNumericField: Boolean(col.isNumericField),
            uniqueValues: Array.isArray(col.uniqueValues) ? col.uniqueValues : []
          };
        });
        
        setDataColumns(columns);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching columns:', err);
        
        if (retryCount < 3) {
          const retryDelay = 2000 * Math.pow(2, retryCount);
          setError(`Attempting to reconnect... (${retryCount + 1}/3)`);
          setTimeout(() => {
            fetchDataColumns(retryCount + 1);
          }, retryDelay);
        } else {
          const errorMessage = err.userMessage || 
                              err.response?.data?.message || 
                              (err.message === 'Network Error' ? 
                                'Network connection issue. Please check your internet connection.' : 
                                'Failed to load column data. Please try selecting a different data sheet.');
          setError(errorMessage);
          setLoading(false);
        }
      }
    };
    
    fetchDataColumns();
  }, [selectedExcelData]);
  
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
          backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.9)' : 'rgba(0, 0, 0, 0.8)',
          titleColor: '#FFFFFF',
          bodyColor: '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(80, 80, 80, 0.9)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          padding: 10,
          displayColors: true
        }
      },
      scales: chartType === 'radar' ? {
        r: {
          angleLines: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
          },
          grid: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
          },
          pointLabels: {
            color: textColor,
            font: {
              size: 12,
              weight: 'bold'
            },
            display: true // Always show labels for radar chart axes
          },
          ticks: {
            color: textColor,
            backdropColor: 'transparent',
            font: {
              size: 11
            },
            display: true
          }
        }
      } : {
        x: {
          title: {
            display: true,
            text: xAxisColumns.length > 0 ? xAxisColumns.join(', ') : 'X Axis',
            color: textColor,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {top: 10, bottom: 10}
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: yAxisLabel,
            color: textColor,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {top: 0, bottom: 10}
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    });
  }, [chartTitle, isDarkMode, xAxisColumns, yAxisColumns, chartType]);
  
  // Generate preview data when configuration changes
  useEffect(() => {
    if (activeStep === 3 && selectedExcelData && chartType) {
      // Check if we have valid axis selections based on chart type
      const hasValidXAxis = ['pie', 'doughnut', 'polarArea'].includes(chartType) || xAxisColumns.length > 0;
      const hasValidYAxis = yAxisColumns.length > 0;
      
      if (hasValidXAxis && hasValidYAxis) {
        generateChartPreview();
      }
    }
  }, [activeStep, selectedExcelData, chartType, xAxisColumns, yAxisColumns, categoryColumn, sizeColumn, chartTitle, chartDescription, chartColors]);
  
  // Handle stepper navigation
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle file and Excel data selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.value);
  };
  
  const handleExcelDataChange = (event) => {
    setSelectedExcelData(event.target.value);
    setXAxisColumns([]);
    setYAxisColumns([]);
    setCategoryColumn('');
    setSizeColumn('');
  };
  
  // Handle chart type change
  const handleChartTypeChange = (type) => {
    setChartType(type);
    if (['pie', 'doughnut', 'polarArea'].includes(type)) {
      setXAxisColumns([]);
    }
  };
  
  // Handle temporary axis selection
  const handleTempXAxisChange = (event) => {
    const { value } = event.target;
    setTempXAxisColumn(value);
    
    if (axisUpdateMode === 'immediate') {
      const updatedXAxisColumns = [...xAxisColumns];
      if (!updatedXAxisColumns.includes(value) && value !== '') {
        updatedXAxisColumns.push(value);
        setXAxisColumns(updatedXAxisColumns);
      }
    }
  };

  const handleTempYAxisChange = (event) => {
    const { value } = event.target;
    setTempYAxisColumn(value);
    
    if (axisUpdateMode === 'immediate') {
      const updatedYAxisColumns = [...yAxisColumns];
      if (!updatedYAxisColumns.includes(value) && value !== '') {
        updatedYAxisColumns.push(value);
        setYAxisColumns(updatedYAxisColumns);
      }
    }
  };

  const addAxisToChart = (axisType) => {
    if (axisType === 'x' && tempXAxisColumn && !xAxisColumns.includes(tempXAxisColumn)) {
      setXAxisColumns([...xAxisColumns, tempXAxisColumn]);
      setTempXAxisColumn('');
    } else if (axisType === 'y' && tempYAxisColumn && !yAxisColumns.includes(tempYAxisColumn)) {
      setYAxisColumns([...yAxisColumns, tempYAxisColumn]);
      setTempYAxisColumn('');
    }
  };

  const removeAxisFromChart = (axisType, columnName) => {
    if (axisType === 'x') {
      setXAxisColumns(xAxisColumns.filter(col => col !== columnName));
    } else if (axisType === 'y') {
      setYAxisColumns(yAxisColumns.filter(col => col !== columnName));
    }
  };

  const toggleAxisUpdateMode = () => {
    setAxisUpdateMode(prevMode => prevMode === 'immediate' ? 'manual' : 'immediate');
  };
  
  const handleXAxisChange = (event) => {
    const { value } = event.target;
    setXAxisColumns(value);
  };
  
  const handleYAxisChange = (event) => {
    const { value } = event.target;
    setYAxisColumns(value);
  };
  
  const handleCategoryChange = (event) => {
    setCategoryColumn(event.target.value);
  };
  
  const handleSizeChange = (event) => {
    setSizeColumn(event.target.value);
  };
  
  // Save the chart
  const saveChart = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      setErrorMessage(null);
      
      // Validate chart title with regex for alphanumeric and spaces only
      if (!chartTitle.trim() || chartTitle.trim().length < 3 || !/^[a-zA-Z0-9\s]+$/.test(chartTitle)) {
        const errorMsg = !chartTitle.trim() || chartTitle.trim().length < 3 ?
          'Please enter a chart title with at least 3 characters.' :
          'Chart title can only contain letters, numbers, and spaces.';
        setError(errorMsg);
        setErrorMessage(errorMsg);
        setActiveStep(2); // Move to the step with title input
        setLoading(false);
        return;
      }
      
      if (!chartType) {
        const errorMsg = 'Please select a chart type before saving.';
        setError(errorMsg);
        setErrorMessage(errorMsg);
        setActiveStep(1); // Move to chart type selection step
        setLoading(false);
        return;
      }
      
      if (!selectedExcelData) {
        const errorMsg = 'Please select a data source before saving.';
        setError(errorMsg);
        setErrorMessage(errorMsg);
        setActiveStep(0); // Move to data source selection step
        setLoading(false);
        return;
      }
      
      // Check if we need X-axis columns for this chart type
      const requiresXAxis = !['pie', 'doughnut', 'polarArea'].includes(chartType);
      if (requiresXAxis && (!xAxisColumns || xAxisColumns.length === 0)) {
        const errorMsg = 'Please select at least one X-axis column for this chart type.';
        setError(errorMsg);
        setErrorMessage(errorMsg);
        setActiveStep(2); // Move to axis selection step
        setLoading(false);
        return;
      }
      
      if (yAxisColumns.length === 0) {
        const errorMsg = 'Please select at least one Y-axis column.';
        setError(errorMsg);
        setErrorMessage(errorMsg);
        setActiveStep(2); // Move to axis selection step
        setLoading(false);
        return;
      }
      
      // Additional validation for specific chart types
      if (chartType === 'bubble' && !sizeColumn) {
        const errorMsg = 'Bubble charts require a Size field to determine bubble size. Please select a numeric field.';
        setError(errorMsg);
        setErrorMessage(errorMsg);
        setActiveStep(2); // Move to axis selection step
        setLoading(false);
        return;
      }
      
      if (['scatter', 'bubble'].includes(chartType) && !categoryColumn) {
        const errorMsg = `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} charts require a Category field to group data points. Please select a category field.`;
        setError(errorMsg);
        setErrorMessage(errorMsg);
        setActiveStep(2); // Move to axis selection step
        setLoading(false);
        return;
      }
      
      const chartData = {
        title: chartTitle.trim(),
        description: chartDescription.trim(),
        type: chartType,
        excelDataId: selectedExcelData,
        config: {
          xAxis: xAxisColumns,
          yAxis: yAxisColumns,
          categoryField: categoryColumn || undefined,
          sizeField: sizeColumn || undefined,
          aggregationMethod: aggregationMethod || 'sum'
        }
      };
      
      // Show saving feedback
      const actionType = isEditMode ? 'Updating' : 'Saving';
      setErrorMessage(`${actionType} chart... Please wait.`);
      
      let response;
      
      if (isEditMode && id) {
        response = await api.put(`/api/charts/${id}`, chartData);
      } else {
        response = await api.post('/api/charts', chartData);
      }
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Show success message
      setErrorMessage(`Chart ${isEditMode ? 'updated' : 'saved'} successfully! Redirecting...`);
      
      // Get the chart ID from the response
      const chartId = isEditMode ? id : response.data.chart.id;
      
      // Verify the chart exists before redirecting
      try {
        // Add a small delay to ensure the chart is fully saved in the database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the chart exists by making a GET request
        await api.get(`/api/charts/${chartId}`);
        
        // If successful, redirect to the charts page
        setTimeout(() => {
          navigate('/charts');
        }, 500);
      } catch (verifyErr) {
        console.error('Error verifying chart existence:', verifyErr);
        // Still redirect to charts page even if verification fails
        setTimeout(() => {
          navigate('/charts');
        }, 500);
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'saving'} chart:`, err);
      
      if (retryCount < 3) {
        const retryDelay = 2000 * Math.pow(2, retryCount);
        setError(`Attempting to reconnect... (${retryCount + 1}/3)`);
        setTimeout(() => {
          saveChart(retryCount + 1);
        }, retryDelay);
      } else {
        const errorMessage = err.userMessage || 
                            err.response?.data?.message || 
                            (err.message === 'Network Error' ? 
                              'Network connection issue. Please check your internet connection.' : 
                              `Failed to ${isEditMode ? 'update' : 'save'} chart. Please check your inputs and try again.`);
        setError(errorMessage);
        setLoading(false);
      }
    }
  };
  
  // Helper function to render chart type icons
  const renderChartTypeIcon = (type) => {
    switch (type) {
      case 'bar':
        return <BarChartIcon fontSize="large" />;
      case 'line':
        return <TimelineIcon fontSize="large" />;
      case 'pie':
      case 'doughnut':
      case 'polarArea':
        return <PieChartIcon fontSize="large" />;
      case 'scatter':
      case 'bubble':
        return <BubbleChartIcon fontSize="large" />;
      default:
        return <TableChartIcon fontSize="large" />;
    }
  };
  
  // Use the renderChartPreview function from chartUtils.js
  const renderChartPreviewComponent = () => {
    return renderChartPreview(chartType, previewData, chartOptions, generateChartPreview);
  };
  
  // Render content for each step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <motion.div variants={itemVariants}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4 font-inter`}>
              Select an Excel file and sheet to visualize
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="flex flex-col">
                <FormControl fullWidth margin="normal">
                  <InputLabel id="file-select-label">Excel File</InputLabel>
                  <Select
                    labelId="file-select-label"
                    id="file-select"
                    value={selectedFile}
                    onChange={handleFileChange}
                    label="Excel File"
                    disabled={loading}
                    className="rounded-lg"
                  >
                    {files.map((file) => (
                      <MenuItem key={file._id} value={file._id}>
                        {file.originalName || file.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Select an Excel file that has been uploaded and processed
                  </FormHelperText>
                </FormControl>
              </motion.div>
              
              <motion.div variants={itemVariants} className="flex flex-col">
                <FormControl fullWidth margin="normal" disabled={!selectedFile}>  
                  <InputLabel id="sheet-select-label">Excel Sheet</InputLabel>
                  <Select
                    labelId="sheet-select-label"
                    id="sheet-select"
                    value={selectedExcelData}
                    onChange={handleExcelDataChange}
                    label="Excel Sheet"
                    className="rounded-lg"
                  >
                    {Array.isArray(excelData) ? excelData.map((sheet) => (
                      <MenuItem key={sheet._id} value={sheet._id}>
                        {sheet.sheetName} ({sheet.rowCount} rows)
                      </MenuItem>
                    )) : null}
                  </Select>
                  <FormHelperText className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Select the sheet containing the data you want to visualize
                  </FormHelperText>
                </FormControl>
              </motion.div>
            </div>
            
            {selectedExcelData && (
              <motion.div 
                variants={itemVariants} 
                className="mt-8"
                initial="hidden"
                animate="visible"
              >
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3 font-inter`}>
                  Available Data Columns
                </h3>
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} p-4 max-h-80 overflow-auto`}>
                  <ul className="divide-y divide-gray-100">
                    {dataColumns.map((column) => (
                      <motion.li 
                        key={column.id}
                        className="py-3 flex items-center justify-between"
                        whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
                      >
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{column.name}</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Type: {column.type}</p>
                        </div>
                        <span 
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            column.type === 'number' ? 'bg-primary-100 text-primary-800' :
                            column.type === 'date' ? 'bg-secondary-100 text-secondary-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {column.type}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
        
      case 1:
        return (
          <motion.div variants={itemVariants}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6 font-inter`}>
              Select the type of chart to create
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: 'bar', label: 'Bar Chart', icon: <BarChartIcon fontSize="large" /> },
                { value: 'line', label: 'Line Chart', icon: <TimelineIcon fontSize="large" /> },
                { value: 'pie', label: 'Pie Chart', icon: <PieChartIcon fontSize="large" /> },
                { value: 'doughnut', label: 'Doughnut Chart', icon: <PieChartIcon fontSize="large" /> },
                { value: 'scatter', label: 'Scatter Plot', icon: <BubbleChartIcon fontSize="large" /> },
                { value: 'bubble', label: 'Bubble Chart', icon: <BubbleChartIcon fontSize="large" /> },
                { value: 'radar', label: 'Radar Chart', icon: <TimelineIcon fontSize="large" /> },
                { value: 'polarArea', label: 'Polar Area Chart', icon: <PieChartIcon fontSize="large" /> }
              ].map((chart) => (
                <motion.div 
                  key={chart.value}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div 
                    className={`h-full flex flex-col items-center p-6 rounded-xl cursor-pointer transition-all duration-200 ${chartType === chart.value 
                      ? `border-2 border-primary-500 ${isDarkMode ? 'bg-primary-900' : 'bg-primary-50'} shadow-md` 
                      : `border ${isDarkMode ? 'border-gray-600 hover:border-primary-700 bg-gray-700' : 'border-gray-200 hover:border-primary-300 bg-white'} hover:shadow-sm`}`}
                    onClick={() => handleChartTypeChange(chart.value)}
                  >
                    <div className={`p-4 mb-2 rounded-full ${chartType === chart.value 
                      ? `text-primary-${isDarkMode ? '300' : '600'} ${isDarkMode ? 'bg-primary-800' : 'bg-primary-100'}` 
                      : `${isDarkMode ? 'text-gray-300 bg-gray-600' : 'text-gray-500 bg-gray-50'}`}`}>
                      {chart.icon}
                    </div>
                    <h3 className={`text-center font-medium ${chartType === chart.value 
                      ? `text-primary-${isDarkMode ? '300' : '700'}` 
                      : `${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
                      {chart.label}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.div variants={itemVariants} className="mt-8">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3 font-inter`}>
                About {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Charts
              </h3>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-5 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm`}>
                <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>
                  {chartType === 'bar' && 'Bar charts are used to compare values across categories. They are ideal for showing discrete data points and comparing quantities.'}
                  {chartType === 'line' && 'Line charts display information as a series of data points connected by straight lines. They are ideal for showing trends over time or continuous data.'}
                  {chartType === 'pie' && 'Pie charts show the relative proportions of different categories as slices of a circle. They work best when you have a small number of categories.'}
                  {chartType === 'doughnut' && 'Doughnut charts are similar to pie charts but with a hole in the center. They show the relative proportions of different categories.'}
                  {chartType === 'scatter' && 'Scatter plots show the relationship between two variables as points on a coordinate system. They are useful for identifying correlations and patterns.'}
                  {chartType === 'bubble' && 'Bubble charts are similar to scatter plots but add a third dimension represented by the size of each bubble. They can show relationships between three variables.'}
                  {chartType === 'radar' && 'Radar charts display multivariate data as a two-dimensional chart with three or more quantitative variables. They are useful for comparing multiple variables at once.'}
                  {chartType === 'polarArea' && 'Polar area charts are similar to pie charts, but each segment has the same angle and differs in how far it extends from the center. They are useful for showing relative sizes.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div variants={itemVariants}>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6 font-inter`}>
              Configure your {chartType} chart
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="space-y-4">
                <TextField
                  fullWidth
                  label="Chart Title"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  className="rounded-lg"
                  placeholder="Enter a descriptive chart title"
                  error={activeStep === 2 && (!chartTitle || chartTitle.trim().length < 3 || !/^[a-zA-Z0-9\s]+$/.test(chartTitle))}
                  helperText={activeStep === 2 && (!chartTitle || chartTitle.trim().length < 3) ? 
                    "Title must be at least 3 characters long" : 
                    activeStep === 2 && !/^[a-zA-Z0-9\s]+$/.test(chartTitle) ? 
                    "Title can only contain letters, numbers and spaces" : ""}
                  InputLabelProps={{
                    style: { color: isDarkMode ? '#CCCCCC' : undefined },
                    required: true
                  }}
                  InputProps={{
                    style: { color: isDarkMode ? '#FFFFFF' : undefined }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : undefined,
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : undefined,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: isDarkMode ? '#90CAF9' : undefined,
                      },
                      '&.Mui-error fieldset': {
                        borderColor: '#d32f2f',
                      },
                    },
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Chart Description (optional)"
                  value={chartDescription}
                  onChange={(e) => setChartDescription(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={2}
                  className="rounded-lg"
                  InputLabelProps={{
                    style: { color: isDarkMode ? '#CCCCCC' : undefined }
                  }}
                  InputProps={{
                    style: { color: isDarkMode ? '#FFFFFF' : undefined }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : undefined,
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : undefined,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: isDarkMode ? '#90CAF9' : undefined,
                      },
                    },
                  }}
                />
                
                <div className={`flex items-center p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={axisUpdateMode === 'immediate'}
                        onChange={toggleAxisUpdateMode}
                        color="primary"
                      />
                    }
                    label={`Chart updates: ${axisUpdateMode === 'immediate' ? 'Immediate' : 'Manual'}`}
                    className="m-0"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        color: isDarkMode ? '#CCCCCC' : undefined
                      }
                    }}
                  />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="md:col-span-1">
                {!['pie', 'doughnut', 'polarArea'].includes(chartType) && (
                  <AxisSelect
                    axisType="x"
                    label="X-Axis Column(s)"
                    value={tempXAxisColumn}
                    onChange={handleTempXAxisChange}
                    columns={dataColumns}
                    selectedColumns={xAxisColumns}
                    onAdd={addAxisToChart}
                    onRemove={removeAxisFromChart}
                    updateMode={axisUpdateMode}
                    chartType={chartType}
                    required={true}
                  />
                )}
                
                <AxisSelect
                  axisType="y"
                  label="Y-Axis Columns (Values)"
                  value={tempYAxisColumn}
                  onChange={handleTempYAxisChange}
                  columns={dataColumns}
                  selectedColumns={yAxisColumns}
                  onAdd={addAxisToChart}
                  onRemove={removeAxisFromChart}
                  updateMode={axisUpdateMode}
                  chartType={chartType}
                  required={true}
                  filterFn={(column) => {
                    const isNumeric = 
                      column.type === 'number' || 
                      column.isNumericField === true ||
                      (typeof column.type === 'string' && 
                        (column.type.includes('int') || 
                         column.type.includes('float') || 
                         column.type.includes('decimal') ||
                         column.type.includes('double'))) ||
                      (column.type === 'mixed' && column.uniqueValues && 
                       column.uniqueValues.some(val => !isNaN(parseFloat(val))));
                    
                    const hasNumericColumns = dataColumns.some(col => 
                      col.type === 'number' || 
                      col.isNumericField === true || 
                      (typeof col.type === 'string' && 
                       (col.type.includes('int') || 
                        col.type.includes('float') || 
                        col.type.includes('decimal') ||
                        col.type.includes('double'))) ||
                      (col.type === 'mixed' && col.uniqueValues && 
                       col.uniqueValues.some(val => !isNaN(parseFloat(val))))
                    );
                    
                    return (isNumeric || !hasNumericColumns) && !yAxisColumns.includes(column.name);
                  }}
                />
                
                {['bar', 'line', 'radar'].includes(chartType) && (
                  <SingleAxisSelect
                    id="category"
                    label="Category Field"
                    value={categoryColumn}
                    onChange={handleCategoryChange}
                    columns={dataColumns}
                    filterFn={(column) => column.type !== 'number'}
                    helperText="Optional field to group data by categories"
                    optional={true}
                    chartType={chartType}
                    required={false}
                  />
                )}
                
                {chartType === 'bubble' && (
                  <SingleAxisSelect
                    id="size"
                    label="Size Field"
                    value={sizeColumn}
                    onChange={handleSizeChange}
                    columns={dataColumns}
                    filterFn={(column) => column.type === 'number'}
                    helperText="Numeric field to determine bubble size"
                    optional={false}
                    chartType={chartType}
                    required={true}
                  />
                )}
                
                {['scatter', 'bubble'].includes(chartType) && (
                  <SingleAxisSelect
                    id="category"
                    label="Category Field"
                    value={categoryColumn}
                    onChange={handleCategoryChange}
                    columns={dataColumns}
                    filterFn={(column) => column.type !== 'number'}
                    helperText="Field to group data points by categories"
                    optional={false}
                    chartType={chartType}
                    required={true}
                  />
                )}
                
                <SingleAxisSelect
                  id="aggregation"
                  label="Data Aggregation"
                  value={aggregationMethod}
                  onChange={(e) => setAggregationMethod(e.target.value)}
                  columns={[
                    { id: 'sum', name: 'Sum', type: 'aggregation' },
                    { id: 'average', name: 'Average', type: 'aggregation' },
                    { id: 'count', name: 'Count', type: 'aggregation' },
                    { id: 'min', name: 'Minimum', type: 'aggregation' },
                    { id: 'max', name: 'Maximum', type: 'aggregation' }
                  ]}
                  helperText="How to aggregate multiple values for the same data point"
                  optional={false}
                  required={false}
                />
                
                {axisUpdateMode === 'manual' && (
                  <motion.div variants={itemVariants} className="mt-6">
                    <button
                      onClick={generateChartPreview}
                      disabled={
                        yAxisColumns.length === 0 || 
                        (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0)
                      }
                      className={`px-6 py-2 rounded-lg font-medium flex items-center transition-all duration-200 ${yAxisColumns.length === 0 || (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0) 
                        ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' 
                        : `bg-primary-${isDarkMode ? '500' : '600'} text-white hover:bg-primary-${isDarkMode ? '600' : '700'} shadow-sm hover:shadow`}`}
                    >
                      <RefreshIcon className="mr-2" />
                      Generate Preview
                    </button>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div variants={itemVariants} className="md:col-span-1">
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3 font-inter`}>
                  Chart Preview
                </h3>
                
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm p-4 h-96`}>
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <CircularProgress />
                    </div>
                  ) : previewData ? (
                    renderChartPreviewComponent()
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} text-center`}>
                        Configure your chart to see a preview
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                onClick={generateChartPreview}
                disabled={loading || !selectedExcelData || !chartType || 
                  (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0) || 
                  yAxisColumns.length === 0}
                className={`px-6 py-2 rounded-lg font-medium flex items-center transition-all duration-200 ${loading || !selectedExcelData || !chartType || 
                  (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0) || 
                  yAxisColumns.length === 0 
                  ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white' 
                  : 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50'}`}
              >
                <RefreshIcon className="mr-2" />
                Generate Preview
              </button>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 font-inter">
              Preview and Save Your Chart
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <motion.div 
                className="md:col-span-8"
                variants={itemVariants}
              >
                {loading ? (
                  <div className="flex justify-center items-center h-96 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <CircularProgress />
                  </div>
                ) : previewData ? (
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-96">
                    {renderChartPreviewComponent()}
                  </div>
                ) : (
                  <div className={`flex justify-center items-center h-96 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-6 text-center`}>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      No preview available. Please go back and configure your chart.
                    </p>
                  </div>
                )}
              </motion.div>
              
              <motion.div 
                className="md:col-span-4"
                variants={itemVariants}
              >
                <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-xl border shadow-sm p-5`}>
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3 font-inter`}>
                    Chart Configuration
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex flex-col">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Chart Type</span>
                      <div className="flex items-center">
                        <div className={`p-2.5 mr-2 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-primary-800 text-primary-300' : 'bg-primary-100 text-primary-600'}`} style={{ minWidth: '32px', minHeight: '32px' }}>
                          {chartType === 'bar' && <BarChartIcon fontSize="small" />}
                          {chartType === 'line' && <TimelineIcon fontSize="small" />}
                          {chartType === 'pie' && <PieChartIcon fontSize="small" />}
                          {chartType === 'doughnut' && <PieChartIcon fontSize="small" />}
                          {chartType === 'scatter' && <BubbleChartIcon fontSize="small" />}
                          {chartType === 'bubble' && <BubbleChartIcon fontSize="small" />}
                          {chartType === 'radar' && <TimelineIcon fontSize="small" />}
                          {chartType === 'polarArea' && <PieChartIcon fontSize="small" />}
                        </div>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{chartType.charAt(0).toUpperCase() + chartType.slice(1)}</span>
                      </div>
                    </li>
                    <li className="flex flex-col">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Title</span>
                      <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{chartTitle || 'Untitled'}</span>
                    </li>
                    {chartDescription && (
                      <li className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Description</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{chartDescription}</span>
                      </li>
                    )}
                    {!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length > 0 && (
                      <li className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>X-Axis Columns</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{xAxisColumns.join(', ')}</span>
                      </li>
                    )}
                    {yAxisColumns.length > 0 && (
                      <li className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Y-Axis Columns</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{yAxisColumns.join(', ')}</span>
                      </li>
                    )}
                    {categoryColumn && (
                      <li className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Category Field</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{categoryColumn}</span>
                      </li>
                    )}
                    {chartType === 'bubble' && sizeColumn && (
                      <li className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Size Field</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{sizeColumn}</span>
                      </li>
                    )}
                    {aggregationMethod && (
                      <li className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Data Aggregation</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{aggregationMethod.charAt(0).toUpperCase() + aggregationMethod.slice(1)}</span>
                      </li>
                    )}
                  </ul>
                  
                  <div className={`h-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} my-4`}></div>
                  
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3 font-inter`}>
                    Data Source
                  </h3>
                  <ul className="space-y-3">
                    {selectedFile && files.find(f => f._id === selectedFile) && (
                      <li className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>File</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{files.find(f => f._id === selectedFile).originalName || files.find(f => f._id === selectedFile).name}</span>
                      </li>
                    )}
                    {selectedExcelData && Array.isArray(excelData) && excelData.find(d => d._id === selectedExcelData) && (
                      <li className="flex flex-col">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Sheet</span>
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{excelData.find(d => d._id === selectedExcelData).sheetName}</span>
                      </li>
                    )}
                    <li className="flex flex-col">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Columns</span>
                      <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{dataColumns.length}</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  // Animation variants for framer-motion
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

  const stepperVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // Return JSX
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
            {isEditMode ? 'Edit Chart' : 'Create New Chart'}
          </h1>
        </motion.div>
        
        <motion.div variants={stepperVariants} className="mb-8">
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </motion.div>
        
        {/* Error message display */}
        {(error || errorMessage) && (
          <motion.div 
            variants={itemVariants}
            className="mb-6 sticky top-4 z-50"
          >
            <div className={`${errorMessage && errorMessage.includes('successfully') ? 
              'bg-green-50 border-green-200 text-green-700' : 
              'bg-red-50 border-red-200 text-red-700'} 
              border px-4 py-3 rounded-lg flex items-start shadow-lg`}>
              <div className="flex-shrink-0 mr-2 mt-0.5">
                {errorMessage && errorMessage.includes('successfully') ? (
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
                {errorMessage || error}
              </div>
              {(errorMessage && (errorMessage.includes('successfully') || errorMessage.includes('Please wait'))) && (
                <div className="ml-2">
                  <CircularProgress size={20} color="inherit" />
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        <motion.div variants={itemVariants}>
          {getStepContent(activeStep)}
          
          <motion.div 
            className="flex justify-between mt-8 pt-4 border-t border-gray-200"
            variants={itemVariants}
          >
            <button
              onClick={handleBack}
              disabled={activeStep === 0}
              className={`px-6 py-2 rounded-lg border-2 border-primary-500 font-medium transition-all duration-200 ${activeStep === 0 
                ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400' 
                : 'text-primary-600 hover:bg-primary-50'}`}
            >
              Back
            </button>
            
            {activeStep === steps.length - 1 ? (
              <button
                onClick={saveChart}
                disabled={loading || !chartTitle || yAxisColumns.length === 0 || 
                  (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0)}
                className={`px-6 py-2 rounded-lg bg-primary-600 text-white font-medium flex items-center transition-all duration-200 ${loading || !chartTitle || yAxisColumns.length === 0 || 
                  (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0) 
                  ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                  : 'hover:bg-primary-700 shadow-sm hover:shadow'}`}
              >
                <SaveIcon className="mr-2" />
                {isEditMode ? 'Update Chart' : 'Save Chart'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && (!selectedFile || !selectedExcelData)) ||
                  (activeStep === 1 && !chartType) ||
                  (activeStep === 2 && (
                    !chartTitle || 
                    yAxisColumns.length === 0 || 
                    (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0)
                  ))
                }
                className={`px-6 py-2 rounded-lg bg-primary-600 text-white font-medium transition-all duration-200 ${(activeStep === 0 && (!selectedFile || !selectedExcelData)) ||
                  (activeStep === 1 && !chartType) ||
                  (activeStep === 2 && (
                    !chartTitle || 
                    yAxisColumns.length === 0 || 
                    (!['pie', 'doughnut', 'polarArea'].includes(chartType) && xAxisColumns.length === 0)
                  )) 
                  ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                  : 'hover:bg-primary-700 shadow-sm hover:shadow'}`}
              >
                Next
              </button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ChartCreator;