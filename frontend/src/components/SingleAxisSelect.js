import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
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
 * A reusable component for single value axis selection in charts
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the select
 * @param {string} props.label - Label for the select input
 * @param {string} props.value - Currently selected value
 * @param {Function} props.onChange - Handler for value change
 * @param {Array} props.columns - Available columns to select from
 * @param {Function} props.filterFn - Optional function to filter available columns
 * @param {string} props.helperText - Optional helper text
 * @param {boolean} props.optional - Whether the field is optional
 * @param {string} props.chartType - The type of chart being created
 * @param {boolean} props.required - Whether the field is required
 */
const SingleAxisSelect = ({
  id,
  label,
  value,
  onChange,
  columns,
  filterFn,
  helperText,
  optional = false,
  chartType,
  required = false
}) => {
  // Default filter function if none provided - no filtering
  const defaultFilterFn = () => true;
  
  // Use provided filter function or default
  const filterFunction = filterFn || defaultFilterFn;
  
  // Get help text based on axis type
  const getAxisHelpText = () => {
    switch(id) {
      case 'category':
        return 'Category field is used to group data points in charts. This helps organize your data into meaningful segments.';
      case 'size':
        if (chartType === 'bubble') {
          return 'Size field determines the size of bubbles in bubble charts based on numeric values. This is required for bubble charts.';
        }
        return 'Size field determines the relative size of data points based on numeric values.';
      default:
        return helperText || 'Select a column to include in your chart.';
    }
  };

  // Determine if this field has an error (required but no selection)
  const hasError = required && !value;

  return (
    <motion.div variants={itemVariants} className={`mt-6 ${hasError ? 'border-l-4 border-red-500 pl-3' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-medium text-gray-800 font-inter flex items-center ${hasError ? 'text-red-500' : ''}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          <Tooltip title={getAxisHelpText()} placement="top">
            <IconButton size="small" className="ml-1">
              <HelpOutlineIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        </h3>
      </div>
      
      {hasError && (
        <Alert severity="error" className="mb-3" sx={{ py: 0.5 }}>
          {id === 'size' && chartType === 'bubble' ? 
            'Please select a Size field for bubble charts' : 
            `Please select a ${label} field`}
        </Alert>
      )}
      
      <FormControl fullWidth margin="normal">
        <InputLabel 
          id={`${id}-select-label`}
          error={required && !value}
        >
          {label}{optional ? ' (Optional)' : ''}
        </InputLabel>
        <Select
          labelId={`${id}-select-label`}
          id={`${id}-select`}
          value={value}
          onChange={onChange}
          label={`${label}${optional ? ' (Optional)' : ''}`}
          className="rounded-lg"
          error={required && !value}
        >
          {optional && <MenuItem value=""><em>None</em></MenuItem>}
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
    </motion.div>
  );
};

export default SingleAxisSelect;