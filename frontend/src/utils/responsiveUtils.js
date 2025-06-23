import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Custom hook to get responsive breakpoint flags
 * @returns {Object} Object containing isMobile, isTablet, and isDesktop flags
 */
export const useResponsiveBreakpoints = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  return { isMobile, isTablet, isDesktop };
};

/**
 * Get responsive spacing based on screen size
 * @param {Object} theme - Material-UI theme object
 * @param {Object} options - Options for spacing
 * @param {Object} options.mobile - Mobile spacing values
 * @param {Object} options.tablet - Tablet spacing values
 * @param {Object} options.desktop - Desktop spacing values
 * @returns {Object} Responsive spacing object
 */
export const getResponsiveSpacing = (theme, { mobile, tablet, desktop }) => {
  return {
    [theme.breakpoints.down('sm')]: mobile,
    [theme.breakpoints.between('sm', 'md')]: tablet || desktop,
    [theme.breakpoints.up('md')]: desktop
  };
};

/**
 * Get responsive typography based on screen size
 * @param {Object} theme - Material-UI theme object
 * @param {Object} options - Options for typography
 * @param {Object} options.mobile - Mobile typography values
 * @param {Object} options.tablet - Tablet typography values
 * @param {Object} options.desktop - Desktop typography values
 * @returns {Object} Responsive typography object
 */
export const getResponsiveTypography = (theme, { mobile, tablet, desktop }) => {
  return {
    [theme.breakpoints.down('sm')]: mobile,
    [theme.breakpoints.between('sm', 'md')]: tablet || desktop,
    [theme.breakpoints.up('md')]: desktop
  };
};

/**
 * Get responsive layout based on screen size
 * @param {Object} theme - Material-UI theme object
 * @param {Object} options - Options for layout
 * @param {Object} options.mobile - Mobile layout values
 * @param {Object} options.tablet - Tablet layout values
 * @param {Object} options.desktop - Desktop layout values
 * @returns {Object} Responsive layout object
 */
export const getResponsiveLayout = (theme, { mobile, tablet, desktop }) => {
  return {
    [theme.breakpoints.down('sm')]: mobile,
    [theme.breakpoints.between('sm', 'md')]: tablet || desktop,
    [theme.breakpoints.up('md')]: desktop
  };
};

/**
 * Common responsive styles that can be reused across components
 */
export const responsiveStyles = {
  // Container padding that adjusts based on screen size
  containerPadding: (theme) => ({
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3),
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(4),
    },
  }),
  
  // Card styles that adjust based on screen size
  responsiveCard: (theme) => ({
    borderRadius: '8px',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
    },
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(3),
    },
  }),
  
  // Typography that adjusts based on screen size
  responsiveHeading: (theme) => ({
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.25rem',
    },
    [theme.breakpoints.between('sm', 'md')]: {
      fontSize: '1.5rem',
    },
    [theme.breakpoints.up('md')]: {
      fontSize: '2rem',
    },
  }),
  
  // Button sizes that adjust based on screen size
  responsiveButton: (theme) => ({
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      marginBottom: theme.spacing(1),
    },
    [theme.breakpoints.up('sm')]: {
      width: 'auto',
      marginRight: theme.spacing(2),
    },
  }),
  
  // Grid spacing that adjusts based on screen size
  responsiveGridSpacing: (theme) => ({
    [theme.breakpoints.down('sm')]: {
      gap: theme.spacing(2),
    },
    [theme.breakpoints.up('sm')]: {
      gap: theme.spacing(3),
    },
  }),
  
  // Table styles that adjust based on screen size
  responsiveTable: (theme) => ({
    [theme.breakpoints.down('sm')]: {
      '& .MuiTableCell-root': {
        padding: theme.spacing(1),
      },
    },
    [theme.breakpoints.up('sm')]: {
      '& .MuiTableCell-root': {
        padding: theme.spacing(1.5),
      },
    },
    [theme.breakpoints.up('md')]: {
      '& .MuiTableCell-root': {
        padding: theme.spacing(2),
      },
    },
  }),

  // Common scrollbar styling for tables and containers
  scrollbarStyles: {
    overflowX: 'auto',
    '&::-webkit-scrollbar': { height: '8px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
    '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0,0,0,0.05)' }
  },

  // Common button styling with hover effects
  buttonStyles: (theme, isDarkMode) => ({
    base: {
      borderRadius: '8px',
      textTransform: 'none',
      fontWeight: 'medium',
      transition: 'all 0.3s ease',
      boxShadow: isDarkMode 
        ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
        : '0 4px 8px rgba(33, 150, 243, 0.2)',
      '&:hover': {
        boxShadow: isDarkMode 
          ? '0 6px 12px rgba(0, 0, 0, 0.5)' 
          : '0 6px 12px rgba(33, 150, 243, 0.3)',
        transform: 'translateY(-2px)'
      }
    },
    // For view buttons
    view: {
      mr: 1
    },
    // For icon buttons with color parameter
    iconButton: (color) => (theme) => ({
      color: theme.palette[color].main,
      '&:hover': { backgroundColor: `rgba(${theme.palette[color].main}, 0.1)` }
    })
  }),

  // Common Paper card styling
  paperCard: (theme, isDarkMode) => ({
    borderRadius: '16px', 
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: isDarkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
      : '0 8px 32px rgba(33, 150, 243, 0.15)'
  }),

  // Gradient background styling
  gradientBackground: (theme, isDarkMode) => ({
    background: `linear-gradient(135deg, ${isDarkMode ? '#1a237e30' : '#e3f2fd'} 0%, ${isDarkMode ? '#0d47a130' : '#bbdefb'} 100%)`,
    pt: 6,
    pb: 6,
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center'
  })
};