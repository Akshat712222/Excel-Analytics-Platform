import React from 'react';
import { useResponsiveBreakpoints } from '../../utils/responsiveUtils';

/**
 * A responsive container component that renders different content based on screen size
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.mobileContent - Content to render on mobile devices
 * @param {React.ReactNode} props.tabletContent - Content to render on tablet devices
 * @param {React.ReactNode} props.desktopContent - Content to render on desktop devices
 * @param {React.ReactNode} props.fallbackContent - Fallback content if specific device content is not provided
 * @returns {React.ReactNode} The appropriate content based on screen size
 */
const ResponsiveContainer = ({
  mobileContent,
  tabletContent,
  desktopContent,
  fallbackContent
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsiveBreakpoints();

  if (isMobile && mobileContent) {
    return mobileContent;
  }

  if (isTablet && tabletContent) {
    return tabletContent;
  }

  if (isDesktop && desktopContent) {
    return desktopContent;
  }

  // If specific content for the current device is not provided,
  // try to use the most appropriate alternative
  if (isMobile) {
    return tabletContent || desktopContent || fallbackContent;
  }

  if (isTablet) {
    return desktopContent || mobileContent || fallbackContent;
  }

  if (isDesktop) {
    return tabletContent || mobileContent || fallbackContent;
  }

  // Fallback content as last resort
  return fallbackContent || null;
};

export default ResponsiveContainer;