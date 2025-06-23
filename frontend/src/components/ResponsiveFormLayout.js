import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';

/**
 * ResponsiveFormLayout - A reusable component for creating responsive form layouts
 * 
 * This component provides a consistent layout for forms across different screen sizes,
 * with appropriate spacing, typography, and container styling.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Form content
 * @param {String} props.title - Form title
 * @param {String} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.actions - Form actions (buttons, etc.)
 * @param {Object} props.paperProps - Props for the Paper component
 * @param {Object} props.titleProps - Props for the title Typography
 * @param {Object} props.subtitleProps - Props for the subtitle Typography
 * @param {Object} props.contentProps - Props for the content container
 * @param {Object} props.actionsProps - Props for the actions container
 * @returns {React.ReactElement}
 */
const ResponsiveFormLayout = ({
  children,
  title,
  subtitle,
  actions,
  paperProps = {},
  titleProps = {},
  subtitleProps = {},
  contentProps = {},
  actionsProps = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: '12px', 
        overflow: 'hidden',
        width: '100%',
        ...paperProps.sx
      }}
      {...paperProps}
    >
      {/* Header */}
      {(title || subtitle) && (
        <Box 
          sx={{ 
            p: isMobile ? 2 : 3, 
            borderBottom: '1px solid', 
            borderColor: 'divider'
          }}
        >
          {title && (
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                ...titleProps.sx
              }}
              {...titleProps}
            >
              {title}
            </Typography>
          )}
          
          {subtitle && (
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ 
                mt: title ? 1 : 0,
                ...subtitleProps.sx
              }}
              {...subtitleProps}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      
      {/* Content */}
      <Box 
        sx={{ 
          p: isMobile ? 2 : 3,
          ...contentProps.sx
        }}
        {...contentProps}
      >
        <Grid container spacing={isMobile ? 2 : 3}>
          {children}
        </Grid>
      </Box>
      
      {/* Actions */}
      {actions && (
        <>
          <Divider />
          <Box 
            sx={{ 
              p: isMobile ? 2 : 3,
              display: 'flex',
              justifyContent: 'flex-end',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 2,
              ...actionsProps.sx
            }}
            {...actionsProps}
          >
            {actions}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ResponsiveFormLayout;