import { useTheme } from '@mui/material/styles';
import { useMediaQuery, Box, Alert, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { Bar, Line, Pie, Scatter, Bubble, Radar, PolarArea, Doughnut } from 'react-chartjs-2';

/**
 * Chart utility functions for formatting and processing chart data
 * These functions are shared between ChartCreator, ChartEdit, and ChartViewer components
 */

// Standard chart colors to use across the application
export const chartColors = [
  '#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', 
  '#FF9800', '#795548', '#607D8B', '#3F51B5', '#009688'
];

/**
 * Format chart preview data for Chart.js based on processed data
 * @param {Object} processedData - The processed data from the server
 * @param {string} chartType - The type of chart
 * @param {Array} chartColors - Array of colors to use for the chart
 * @returns {Object} The formatted chart data
 */
export const formatChartPreviewData = (processedData, chartType, chartColors) => {
  console.log('formatChartPreviewData called with:', { 
    hasProcessedData: !!processedData, 
    chartType, 
    hasChartColors: Array.isArray(chartColors) 
  });

  // Enhanced validation with detailed error messages
  if (!processedData) {
    console.error('formatChartPreviewData: processedData is required');
    return null;
  }

  if (!chartType) {
    console.error('formatChartPreviewData: chartType is required');
    return null;
  }

  if (!chartColors || !Array.isArray(chartColors) || chartColors.length === 0) {
    console.error('formatChartPreviewData: valid chartColors array is required');
    // Use default colors if not provided
    chartColors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8E24AA', 
      '#00ACC1', '#FB8C00', '#607D8B', '#FF5722', '#009688'
    ];
  }

  try {
    // Validate datasets
    if (!processedData.datasets) {
      console.error('formatChartPreviewData: processedData is missing datasets property');
      return null;
    }
    
    if (!Array.isArray(processedData.datasets)) {
      console.error('formatChartPreviewData: datasets is not an array:', processedData.datasets);
      return null;
    }
    
    if (processedData.datasets.length === 0) {
      console.error('formatChartPreviewData: datasets array is empty');
      return null;
    }

    // For non-scatter/bubble charts, validate labels
    if (!['scatter', 'bubble'].includes(chartType)) {
      if (!processedData.labels) {
        console.error(`formatChartPreviewData: labels are required for chart type: ${chartType}`);
        return null;
      }
      
      if (!Array.isArray(processedData.labels)) {
        console.error(`formatChartPreviewData: labels is not an array:`, processedData.labels);
        return null;
      }
    }
    
    let chartData;
    
    if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
      // Validate first dataset has data
      if (!processedData.datasets[0] || !processedData.datasets[0].data || !Array.isArray(processedData.datasets[0].data)) {
        console.error('formatChartPreviewData: first dataset is missing or has invalid data for pie/doughnut/polarArea chart');
        return null;
      }
      
      chartData = {
        labels: processedData.labels,
        datasets: [{
          data: processedData.datasets[0].data,
          backgroundColor: chartColors.slice(0, processedData.labels.length),
          borderWidth: 1
        }]
      };
    } else if (['scatter', 'bubble'].includes(chartType)) {
      // For scatter/bubble, validate each dataset
      const validDatasets = processedData.datasets.filter(dataset => 
        dataset && dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0
      );
      
      if (validDatasets.length === 0) {
        console.error('formatChartPreviewData: no valid datasets for scatter/bubble chart');
        return null;
      }
      
      chartData = {
        datasets: validDatasets.map((dataset, index) => ({
          label: dataset.label || `Dataset ${index + 1}`,
          data: dataset.data,
          backgroundColor: chartColors[index % chartColors.length],
          borderColor: chartColors[index % chartColors.length],
          ...(chartType === 'bubble' && { pointRadius: null })
        }))
      };
    } else {
      // For other chart types
      const validDatasets = processedData.datasets.filter(dataset => 
        dataset && dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0
      );
      
      if (validDatasets.length === 0) {
        console.error(`formatChartPreviewData: no valid datasets for ${chartType} chart`);
        return null;
      }
      
      chartData = {
        labels: processedData.labels,
        datasets: validDatasets.map((dataset, index) => ({
          label: dataset.label || `Dataset ${index + 1}`,
          data: dataset.data,
          backgroundColor: chartColors[index % chartColors.length],
          borderColor: chartColors[index % chartColors.length],
          borderWidth: 1,
          ...(chartType === 'line' && { fill: false })
        }))
      };
    }
    
    console.log('formatChartPreviewData: Successfully formatted chart data');
    return chartData;
  } catch (err) {
    console.error('Error formatting chart preview data:', err);
    return null;
  }
};

/**
 * Format chart data for Chart.js with enhanced validation and error handling
 * @param {Object} chart - The chart data from the API
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {Object} Formatted data and options for Chart.js
 */
export const formatChartData = (chart, isDarkMode) => {
  // Enhanced validation with detailed error messages and logging
  console.log('formatChartData called with:', { 
    chartId: chart?.id,
    chartType: chart?.type, 
    isDarkMode 
  });
  
  if (!chart) {
    console.error('Chart data is null or undefined');
    return null;
  }
  
  if (!chart.processedData) {
    console.error('Chart is missing processedData:', chart);
    return null;
  }
  
  if (!chart.config) {
    console.error('Chart is missing config:', chart);
    return null;
  }
  
  if (!chart.type) {
    console.error('Chart is missing type:', chart);
    return null;
  }
  
  const { processedData, config, type } = chart;
  
  // More detailed dataset validation
  if (!processedData.datasets) {
    console.error('Chart processedData is missing datasets property:', processedData);
    return null;
  }
  
  if (!Array.isArray(processedData.datasets)) {
    console.error('Chart datasets is not an array:', processedData.datasets);
    return null;
  }
  
  if (processedData.datasets.length === 0) {
    console.error('Chart has empty datasets array:', processedData);
    return null;
  }
  
  // Validate each dataset has valid data
  const hasValidDataset = processedData.datasets.some(dataset => 
    dataset && dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0
  );
  
  if (!hasValidDataset) {
    console.error('Chart has no valid data in any dataset:', processedData.datasets);
    return null;
  }
  
  // For non-scatter/bubble charts, validate labels
  if (!['scatter', 'bubble'].includes(type)) {
    if (!processedData.labels) {
      console.error('Chart processedData is missing labels property for chart type:', type);
      return null;
    }
    
    if (!Array.isArray(processedData.labels)) {
      console.error('Chart labels is not an array:', processedData.labels);
      return null;
    }
    
    if (processedData.labels.length === 0) {
      console.error('Chart has empty labels array:', processedData);
      return null;
    }
  }
  
  // Set colors based on dark mode
  const textColor = isDarkMode ? '#e0e0e0' : '#333333';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  // Generate colors for datasets with improved palette
  const colors = [
    '#4285F4', // Google Blue
    '#EA4335', // Google Red
    '#FBBC05', // Google Yellow
    '#34A853', // Google Green
    '#8E24AA', // Purple
    '#00ACC1', // Cyan
    '#FB8C00', // Orange
    '#607D8B', // Blue Grey
    '#FF5722', // Deep Orange
    '#009688', // Teal
    '#3F51B5', // Indigo
    '#795548'  // Brown
  ];
  
  try {
    // Apply colors to datasets with error handling
    const datasets = processedData.datasets.map((dataset, index) => {
      if (!dataset) {
        console.warn(`Dataset at index ${index} is invalid, using default values`);
        return {
          label: `Dataset ${index + 1}`,
          data: [],
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length],
          borderWidth: 2
        };
      }
      
      // Ensure dataset has valid data array
      const validData = Array.isArray(dataset.data) ? dataset.data : [];
      
      return {
        ...dataset,
        data: validData,
        backgroundColor: type === 'line' ? `rgba(${index * 50 % 255}, ${(index * 80 + 100) % 255}, ${(index * 120 + 50) % 255}, 0.2)` : colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 2,
        pointBackgroundColor: colors[index % colors.length],
        pointBorderColor: isDarkMode ? '#121212' : '#ffffff',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: colors[index % colors.length],
        pointHoverBorderColor: isDarkMode ? '#121212' : '#ffffff',
        fill: type === 'line' ? 'origin' : undefined,
      };
    });
    
    // Create data object
    const data = {
      labels: processedData.labels,
      datasets
    };
    
    // Create options object with improved configuration
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor,
            font: {
              size: 12
            },
            padding: 15
          }
        },
        title: {
          display: true,
          text: chart.title || 'Chart',
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
          mode: 'index',
          intersect: false,
          backgroundColor: isDarkMode ? '#333' : 'rgba(255, 255, 255, 0.9)',
          titleColor: isDarkMode ? '#fff' : '#333',
          bodyColor: isDarkMode ? '#fff' : '#333',
          borderColor: isDarkMode ? '#555' : '#ddd',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 4,
          displayColors: true,
          callbacks: {
            // Add custom formatting for tooltip values if needed
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
      scales: {
        x: {
          title: {
            display: true,
            text: Array.isArray(config.xAxis) ? config.xAxis.join(', ') : config.xAxis,
            color: textColor,
            padding: { top: 10 }
          },
          ticks: {
            color: textColor,
            maxRotation: 45,
            minRotation: 0
          },
          grid: {
            color: gridColor,
            drawBorder: true,
            drawOnChartArea: true
          }
        },
        y: {
          title: {
            display: true,
            text: Array.isArray(config.yAxis) ? config.yAxis.join(', ') : config.yAxis,
            color: textColor,
            padding: { bottom: 10 }
          },
          ticks: {
            color: textColor,
            precision: 0
          },
          grid: {
            color: gridColor,
            drawBorder: true,
            drawOnChartArea: true
          },
          beginAtZero: true
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    };
    
    // Special options for specific chart types
    if (type === 'pie' || type === 'doughnut' || type === 'polarArea') {
      // These chart types don't use scales
      delete options.scales;
      
      // Add specific options for these chart types
      options.plugins.legend.position = 'right';
      options.plugins.tooltip.callbacks.label = function(context) {
        const label = context.label || '';
        const value = context.raw || 0;
        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage = Math.round((value / total) * 100);
        return `${label}: ${value} (${percentage}%)`;
      };
    } else if (type === 'radar') {
      // Radar charts use a different scale
      delete options.scales;
      options.scales = {
        r: {
          angleLines: {
            color: gridColor
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor,
            font: {
              size: 12
            }
          },
          ticks: {
            color: textColor,
            backdropColor: isDarkMode ? '#1e1e1e' : 'rgba(255, 255, 255, 0.8)',
            showLabelBackdrop: true,
            backdropPadding: 2,
            precision: 0
          },
          beginAtZero: true
        }
      };
    }
    
    return { data, options };
  } catch (error) {
    console.error('Error formatting chart data:', error);
    return null;
  }
};

/**
 * Get the appropriate icon for a chart type
 * @param {string} type - The chart type
 * @returns {string} Icon name for the chart type
 */
export const getChartTypeIcon = (type) => {
  switch (type) {
    case 'bar':
      return 'BarChart';
    case 'line':
      return 'Timeline';
    case 'pie':
    case 'doughnut':
    case 'polarArea':
      return 'PieChart';
    case 'scatter':
    case 'bubble':
      return 'BubbleChart';
    case 'radar':
      return 'RadarChart';
    default:
      return 'TableChart';
  }
};

// Second declaration of formatChartPreviewData removed to fix duplicate declaration error

/**
 * Render the appropriate chart component based on chart type
 * @param {string} chartType - The type of chart to render
 * @param {Object} chartData - The formatted chart data
 * @param {Object} chartOptions - The chart options
 * @returns {JSX.Element} The chart component
 */
export const renderChart = (chartType, chartData, chartOptions) => {
  if (!chartData) return null;
  
  const chartProps = {
    data: chartData,
    options: chartOptions,
    height: 300
  };
  
  // This function should be used with the appropriate imports from react-chartjs-2
  // The actual implementation will depend on the imports available in the component
  return { chartType, chartProps };
};

/**
 * Render chart preview based on chart type
 * @param {string} chartType - The type of chart to render
 * @param {Object} previewData - The chart data
 * @param {Object} chartOptions - The chart options
 * @param {Function} generateChartPreview - Function to regenerate chart preview on error
 * @returns {JSX.Element} The rendered chart component
 */
export const renderChartPreview = (chartType, previewData, chartOptions, generateChartPreview) => {
  try {
    if (!previewData) return null;
    
    switch (chartType) {
      case 'line':
        return <Line data={previewData} options={chartOptions} />
      case 'pie':
        return <Pie data={previewData} options={chartOptions} />
      case 'doughnut':
        return <Doughnut data={previewData} options={chartOptions} />
      case 'scatter':
        return <Scatter data={previewData} options={chartOptions} />
      case 'bubble':
        return <Bubble data={previewData} options={chartOptions} />
      case 'radar':
        return <Radar data={previewData} options={chartOptions} />
      case 'polarArea':
        return <PolarArea data={previewData} options={chartOptions} />
      default:
        return <Bar data={previewData} options={chartOptions} />
    }
  } catch (err) {
    console.error('Error rendering chart:', err);
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
        <Alert severity="error" sx={{ mb: 2 }}>
          Error rendering chart: {err.message}
        </Alert>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={generateChartPreview}
          startIcon={<RefreshIcon />}
        >
          Try Again
        </Button>
      </Box>
    );
  }
};

/**
 * Hook to get the current dark mode state
 * @returns {boolean} Whether dark mode is enabled
 */
export const useIsDarkMode = () => {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
};