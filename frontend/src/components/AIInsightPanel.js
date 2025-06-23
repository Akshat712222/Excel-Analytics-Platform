import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Recommend as RecommendIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoGraph as AutoGraphIcon
} from '@mui/icons-material';
import axios from 'axios';
import { responsiveStyles } from '../utils/responsiveUtils';
import { useIsDarkMode } from '../utils/chartUtils';

/**
 * A component that displays AI-generated insights for chart data
 */
const AIInsightPanel = ({ chartId, token }) => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [generating, setGenerating] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = useIsDarkMode();
  
  // Fetch insight data on component mount
  useEffect(() => {
    if (!chartId) return;
    
    const fetchInsight = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await axios.get(`/api/ai-insights/chart/${chartId}`, {
          headers: { 'x-auth-token': token }
        });
        
        setInsight(res.data);
        setLoading(false);
      } catch (err) {
        console.log('Error fetching insight:', err.response?.data?.message || err.message);
        
        // Only set error if it's not a 404 (no insights yet)
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Failed to load insights');
        }
        
        setLoading(false);
      }
    };
    
    fetchInsight();
  }, [chartId, token]);
  
  // Generate new insight
  const handleGenerateInsight = async (type = 'summary') => {
    if (!chartId) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      // Get chart data to find the excelDataId
      const chartRes = await axios.get(`/api/charts/${chartId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (!chartRes.data || !chartRes.data.excelData) {
        throw new Error('Chart data not found');
      }
      
      // Create a new insight
      const res = await axios.post('/api/ai-insights', {
        insightType: type,
        excelDataId: chartRes.data.excelData,
        chartId: chartId
      }, {
        headers: { 'x-auth-token': token }
      });
      
      // Poll for insight completion
      const pollInsight = async (insightId) => {
        try {
          const insightRes = await axios.get(`/api/ai-insights/${insightId}`, {
            headers: { 'x-auth-token': token }
          });
          
          if (insightRes.data.metadata.status === 'completed') {
            setInsight(insightRes.data);
            setGenerating(false);
          } else if (insightRes.data.metadata.status === 'error') {
            setError(`Error generating insight: ${insightRes.data.metadata.error}`);
            setGenerating(false);
          } else {
            // Continue polling
            setTimeout(() => pollInsight(insightId), 2000);
          }
        } catch (pollErr) {
          console.error('Error polling insight:', pollErr);
          setError('Error checking insight status');
          setGenerating(false);
        }
      };
      
      // Start polling
      pollInsight(res.data.insight.id);
      
    } catch (err) {
      console.error('Error generating insight:', err);
      setError(err.response?.data?.message || 'Failed to generate insight');
      setGenerating(false);
    }
  };
  
  // Refresh existing insight
  const handleRefreshInsight = async () => {
    if (!insight) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      await axios.post(`/api/ai-insights/${insight._id}/refresh`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      // Poll for insight completion
      const pollInsight = async (insightId) => {
        try {
          const insightRes = await axios.get(`/api/ai-insights/${insightId}`, {
            headers: { 'x-auth-token': token }
          });
          
          if (insightRes.data.metadata.status === 'completed') {
            setInsight(insightRes.data);
            setGenerating(false);
          } else if (insightRes.data.metadata.status === 'error') {
            setError(`Error refreshing insight: ${insightRes.data.metadata.error}`);
            setGenerating(false);
          } else {
            // Continue polling
            setTimeout(() => pollInsight(insightId), 2000);
          }
        } catch (pollErr) {
          console.error('Error polling insight:', pollErr);
          setError('Error checking insight status');
          setGenerating(false);
        }
      };
      
      // Start polling
      pollInsight(insight._id);
      
    } catch (err) {
      console.error('Error refreshing insight:', err);
      setError(err.response?.data?.message || 'Failed to refresh insight');
      setGenerating(false);
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Get icon for insight type
  const getInsightTypeIcon = (type) => {
    switch (type) {
      case 'summary':
        return <LightbulbIcon />;
      case 'trend':
        return <TrendingUpIcon />;
      case 'anomaly':
        return <WarningIcon />;
      case 'recommendation':
        return <RecommendIcon />;
      case 'forecast':
        return <TimelineIcon />;
      default:
        return <AutoGraphIcon />;
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <Paper sx={{ ...responsiveStyles.paperCard(theme, isDarkMode), p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoGraphIcon sx={{ mr: 1 }} /> AI Insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={30} />
        </Box>
      </Paper>
    );
  }
  
  // If no insight exists yet, show generate button
  if (!insight && !error) {
    return (
      <Paper sx={{ ...responsiveStyles.paperCard(theme, isDarkMode), p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoGraphIcon sx={{ mr: 1 }} /> AI Insights
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Generate AI-powered insights to better understand your data and discover hidden patterns.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<LightbulbIcon />}
          onClick={() => handleGenerateInsight('summary')}
          disabled={generating}
          fullWidth
        >
          {generating ? 'Generating Insights...' : 'Generate Insights'}
        </Button>
        {generating && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="textSecondary">
              This may take a few moments...
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Paper sx={{ ...responsiveStyles.paperCard(theme, isDarkMode), p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoGraphIcon sx={{ mr: 1 }} /> AI Insights
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={() => handleGenerateInsight('summary')}
          disabled={generating}
          fullWidth
        >
          Try Again
        </Button>
      </Paper>
    );
  }
  
  // Render insight content
  return (
    <Paper sx={{ ...responsiveStyles.paperCard(theme, isDarkMode), p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            {getInsightTypeIcon(insight.insightType)}
            <Box sx={{ ml: 1 }}>AI Insights</Box>
          </Typography>
          <Chip 
            size="small" 
            label={insight.insightType.charAt(0).toUpperCase() + insight.insightType.slice(1)} 
            color="primary" 
            sx={{ ml: 1 }} 
          />
        </Box>
        <Box>
          <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
            <IconButton onClick={toggleExpanded} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Insights">
            <IconButton 
              onClick={handleRefreshInsight} 
              size="small" 
              disabled={generating}
              sx={{ ml: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Collapse in={expanded}>
        {generating ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="textSecondary">
              Refreshing insights...
            </Typography>
          </Box>
        ) : (
          <Box>
            {insight.content.summary && (
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {insight.content.summary}
              </Typography>
            )}
            
            {insight.content.keyPoints && insight.content.keyPoints.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Points
                </Typography>
                <List dense disablePadding>
                  {insight.content.keyPoints.map((point, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <LightbulbIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {insight.content.trends && insight.content.trends.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Trends
                </Typography>
                <List dense disablePadding>
                  {insight.content.trends.map((trend, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <TrendingUpIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={trend} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {insight.content.anomalies && insight.content.anomalies.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Anomalies
                </Typography>
                <List dense disablePadding>
                  {insight.content.anomalies.map((anomaly, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <WarningIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={anomaly} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {insight.content.recommendations && insight.content.recommendations.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <List dense disablePadding>
                  {insight.content.recommendations.map((recommendation, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}>
                        <RecommendIcon fontSize="small" color="info" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Generated {new Date(insight.metadata.generatedAt).toLocaleString()}
              </Typography>
              
              <Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<TrendingUpIcon />}
                  onClick={() => handleGenerateInsight('trend')}
                  sx={{ mr: 1 }}
                >
                  Trends
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RecommendIcon />}
                  onClick={() => handleGenerateInsight('recommendation')}
                >
                  Recommendations
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};

export default AIInsightPanel;