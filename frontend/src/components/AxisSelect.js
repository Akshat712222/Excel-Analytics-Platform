import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Alert,
  Tooltip,
  IconButton,
  Box
} from '@mui/material';
import { motion } from 'framer-motion';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Animation variants for motion components
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

/**
 * A reusable component for axis selection in charts
 * 
 * @param {Object} props - Component props
 * @param {string} props.axisType - Type of axis ('x', 'y', 'category', 'size')
 * @param {string} props.label - Label for the select input
 * @param {string} props.value - Currently selected value
 * @param {Function} props.onChange - Handler for value change
 * @param {Array} props.columns - Available columns to select from
 * @param {Array} props.selectedColumns - Already selected columns
 * @param {Function} props.onAdd - Handler for adding column to chart
 * @param {Function} props.onRemove - Handler for removing column from chart
 * @param {string} props.updateMode - Update mode ('immediate' or 'manual')
 * @param {Function} props.filterFn - Optional function to filter available columns
 * @param {string} props.helperText - Optional helper text
 */
const AxisSelect = ({
  axisType,
  label,
  value,
  onChange,
  columns,
  selectedColumns,
  onAdd,
  onRemove,
  updateMode,
  filterFn,
  helperText,
  chartType,
  required = false
}) => {
  // Default filter function if none provided
  const defaultFilterFn = (column) => !selectedColumns.includes(column.name);
  
  // Use provided filter function or default
  const filterFunction = filterFn || defaultFilterFn;
  
  // Get display name for the axis type
  const getAxisDisplayName = () => {
    switch(axisType) {
      case 'x': return 'X-Axis';
      case 'y': return 'Y-Axis';
      case 'category': return 'Category';
      case 'size': return 'Size';
      default: return axisType;
    }
  };
  
  // Get help text based on axis type and chart type
  const getAxisHelpText = () => {
    switch(axisType) {
      case 'x':
        if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
          return 'For this chart type, X-axis columns are optional and represent labels for each segment.';
        }
        return 'X-axis columns define the horizontal axis of your chart. At least one column is required for this chart type.';
      case 'y':
        return 'Y-axis columns define the values to be plotted. At least one column is required for all chart types.';
      case 'category':
        return 'Category field is used to group data points in scatter and bubble charts.';
      case 'size':
        return 'Size field determines the size of bubbles in bubble charts based on data values.';
      default:
        return 'Select columns to include in your chart.';
    }
  };

  // Determine if this axis has an error (required but no selection)
  const hasError = required && selectedColumns.length === 0;

  return (
    <motion.div variants={itemVariants} className={`mb-6 ${hasError ? 'border-l-4 border-red-500 pl-3' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-medium font-inter flex items-center ${hasError ? 'text-red-500' : 'text-gray-800'}`}>
          {label || `${getAxisDisplayName()} Column(s)`}
          {required && <span className="text-red-500 ml-1">*</span>}
          <Tooltip title={getAxisHelpText()} placement="top">
            <IconButton size="small" className="ml-1">
              <HelpOutlineIcon fontSize="small" color={hasError ? "error" : "primary"} />
            </IconButton>
          </Tooltip>
        </h3>
      </div>
      
      {hasError && (
        <Alert severity="error" className="mb-3" sx={{ py: 0.5 }}>
          {axisType === 'x' && !['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
            'Please select at least one X-axis column for this chart type' : 
            axisType === 'y' ? 'Please select at least one Y-axis column' : 
            `Please select a ${getAxisDisplayName()} column`}
        </Alert>
      )}
      
      <div className="flex flex-wrap items-center mb-4 gap-3">
        <FormControl className="min-w-[200px] flex-grow">
          <InputLabel 
            id={`temp-${axisType}-axis-label`}
            error={required && selectedColumns.length === 0}
          >
            {`Add ${label || getAxisDisplayName()} Column`}
          </InputLabel>
          <Select
            labelId={`temp-${axisType}-axis-label`}
            id={`temp-${axisType}-axis-select`}
            value={value}
            onChange={onChange}
            label={`Add ${label || getAxisDisplayName()} Column`}
            className="rounded-lg"
            error={required && selectedColumns.length === 0}
          >
            <MenuItem value=""><em>Select a column</em></MenuItem>
            {columns
              .filter(filterFunction)
              .map((column) => (
                <MenuItem key={column.id} value={column.name}>
                  {column.name} ({column.type})
                </MenuItem>
              ))}
          </Select>
          {helperText && <FormHelperText className="mt-1 text-gray-600">{helperText}</FormHelperText>}
        </FormControl>
        
        {updateMode === 'manual' && (
          <Button
            onClick={() => onAdd(axisType)}
            disabled={!value}
            variant="outlined"
            color="primary"
            className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${!value 
              ? 'opacity-50 cursor-not-allowed border-gray-300 text-gray-400' 
              : 'border-primary-500 text-primary-600 hover:bg-primary-50'}`}
          >
            Add
          </Button>
        )}
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <p className="text-sm text-gray-600 mb-2">
          Selected {label || `${getAxisDisplayName()}`} Columns:
        </p>
        <div className="flex flex-wrap gap-2">
          {selectedColumns.length > 0 ? (
            selectedColumns.map((column) => (
              <motion.span
                key={column}
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {column}
                <button 
                  onClick={() => onRemove(axisType, column)}
                  className="ml-1 text-primary-500 hover:text-primary-700 focus:outline-none"
                >
                  <span className="text-lg">×</span>
                </button>
              </motion.span>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No columns selected
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AxisSelect;