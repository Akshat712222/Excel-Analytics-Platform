import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon,
  TableChart as TableChartIcon,
  DonutLarge as RadarChartIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useIsDarkMode } from '../utils/chartUtils';

/**
 * A reusable component for displaying chart cards in the Charts list
 * 
 * @param {Object} props - Component props
 * @param {Object} props.chart - Chart data object
 * @param {Function} props.onDelete - Handler for delete action
 */
const ChartCard = ({ chart, onDelete }) => {
  const navigate = useNavigate();
  const isDarkMode = useIsDarkMode();
  
  // Animation variants
  const cardHoverVariants = {
    hover: {
      y: -5,
      boxShadow: isDarkMode 
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: {
        y: { type: 'spring', stiffness: 300, damping: 20 },
        boxShadow: { duration: 0.2 }
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get chart icon based on chart type
  const getChartIcon = (type) => {
    switch (type) {
      case 'bar':
        return <BarChartIcon sx={{ fontSize: 24, color: isDarkMode ? '#60A5FA' : '#3B82F6' }} />;
      case 'line':
        return <TimelineIcon sx={{ fontSize: 24, color: isDarkMode ? '#60A5FA' : '#3B82F6' }} />;
      case 'pie':
      case 'doughnut':
        return <PieChartIcon sx={{ fontSize: 24, color: isDarkMode ? '#A78BFA' : '#8B5CF6' }} />;
      case 'scatter':
      case 'bubble':
        return <BubbleChartIcon sx={{ fontSize: 24, color: isDarkMode ? '#34D399' : '#10B981' }} />;
      case 'radar':
      case 'polarArea':
        return <RadarChartIcon sx={{ fontSize: 24, color: isDarkMode ? '#A78BFA' : '#8B5CF6' }} />;
      default:
        return <TableChartIcon sx={{ fontSize: 24, color: isDarkMode ? '#60A5FA' : '#3B82F6' }} />;
    }
  };

  return (
    <motion.div 
      variants={cardHoverVariants}
      whileHover="hover"
      className="h-full"
    >
      <motion.div 
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-card overflow-hidden h-full flex flex-col`}
      >
        <div className="p-6 flex-grow" style={{ color: isDarkMode ? 'white' : 'inherit' }}>
          <div className="flex items-center mb-4">
            <div className={`p-2 rounded-full mr-3 ${chart.type === 'bar' 
              ? isDarkMode ? 'bg-blue-900' : 'bg-primary-50'
              : chart.type === 'pie' || chart.type === 'doughnut' 
                ? isDarkMode ? 'bg-purple-900' : 'bg-purple-50'
                : isDarkMode ? 'bg-green-900' : 'bg-green-50'}`}
            >
              {getChartIcon(chart.type)}
            </div>
            <Typography variant="h6" component="h2" className="font-poppins font-semibold truncate" sx={{ color: isDarkMode ? 'white' : 'text.primary' }}>
              {chart.title}
            </Typography>
          </div>
          {chart.description && (
            <Typography variant="body2" className="mb-4 line-clamp-2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
              {chart.description}
            </Typography>
          )}
          <div className="space-y-2">
            <div className="flex items-center">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-primary-50 text-primary-600'}`}>
                {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)}
              </span>
            </div>
            <Typography variant="body2" className="text-sm" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
              Created: {formatDate(chart.createdAt)}
            </Typography>
            {chart.file && (
              <Typography variant="body2" className="text-sm truncate" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
                Source: {chart.file.originalName || chart.file.name}
              </Typography>
            )}
          </div>
        </div>
        <div className="px-4 py-3 flex justify-between" sx={{ bgcolor: isDarkMode ? 'rgba(25, 25, 25, 0.9)' : 'rgba(245, 245, 245, 0.9)', borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Tooltip title="View Chart">
            <IconButton 
              color="primary" 
              onClick={() => navigate(`/charts/${chart._id}`)}
              sx={{
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Chart">
            <IconButton 
              color="secondary"
              onClick={() => navigate(`/charts/edit/${chart._id}`)}
              sx={{
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(156, 39, 176, 0.08)' : 'rgba(156, 39, 176, 0.04)'
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Chart">
            <IconButton 
              color="error"
              onClick={() => onDelete(chart._id)}
              sx={{
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(211, 47, 47, 0.08)' : 'rgba(211, 47, 47, 0.04)'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChartCard;