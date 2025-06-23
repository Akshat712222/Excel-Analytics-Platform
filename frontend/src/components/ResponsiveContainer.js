import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

/**
 * ResponsiveContainer - A reusable component for handling responsive layouts
 * 
 * This component provides a consistent way to render different content based on screen size
 * without duplicating conditional logic throughout the application.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.mobileContent - Content to display on mobile devices
 * @param {React.ReactNode} props.tabletContent - Content to display on tablet devices (optional)
 * @param {React.ReactNode} props.desktopContent - Content to display on desktop devices
 * @param {Object} props.mobileProps - Additional props for the mobile container
 * @param {Object} props.tabletProps - Additional props for the tablet container
 * @param {Object} props.desktopProps - Additional props for the desktop container
 * @param {Object} props.containerProps - Props applied to the main container regardless of device
 * @returns {React.ReactElement}
 */
const ResponsiveContainer = ({
  mobileContent,
  tabletContent,
  desktopContent,
  mobileProps = {},
  tabletProps = {},
  desktopProps = {},
  containerProps = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Determine which content to render based on screen size
  const renderContent = () => {
    if (isMobile) {
      return (
        <Box {...mobileProps}>
          {mobileContent}
        </Box>
      );
    } else if (isTablet && tabletContent) {
      return (
        <Box {...tabletProps}>
          {tabletContent}
        </Box>
      );
    } else {
      return (
        <Box {...desktopProps}>
          {tabletContent && isTablet ? tabletContent : desktopContent}
        </Box>
      );
    }
  };

  return (
    <Box {...containerProps}>
      {renderContent()}
    </Box>
  );
};

export default ResponsiveContainer;