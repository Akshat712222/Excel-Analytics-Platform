import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Box,
  useTheme
} from '@mui/material';
import { useResponsiveBreakpoints, responsiveStyles } from '../../utils/responsiveUtils';

/**
 * A responsive data view component that displays data in either a card view (mobile/tablet)
 * or a table view (desktop) based on screen size
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects to display
 * @param {Array} props.columns - Array of column configuration objects
 * @param {Function} props.renderActions - Function to render action buttons for each item
 * @param {Object} props.cardProps - Additional props for the Card component
 * @param {Object} props.tableProps - Additional props for the Table component
 * @param {Object} props.containerProps - Additional props for the container
 * @param {Boolean} props.forceCardView - Force card view regardless of screen size
 * @param {Boolean} props.forceTableView - Force table view regardless of screen size
 * @returns {React.ReactNode} The appropriate view based on screen size
 */
const ResponsiveDataView = ({
  data = [],
  columns = [],
  renderActions,
  cardProps = {},
  tableProps = {},
  containerProps = {},
  forceCardView = false,
  forceTableView = false
}) => {
  const { isMobile, isTablet } = useResponsiveBreakpoints();
  
  // Determine which view to show based on screen size and force flags
  const showCardView = forceCardView || (!forceTableView && (isMobile || isTablet));
  
  // Common styles for card and table views
  const commonStyles = {
    card: {
      mb: 2, 
      borderRadius: '12px'
    },
    cardItem: {
      mb: 1.5, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center'
    },
    cardLabel: {
      fontWeight: 'medium', 
      alignItems: 'center'
    },
    cardValue: {
      maxWidth: '60%', 
      wordBreak: 'break-word'
    },
    actionsContainer: {
      mt: 2, 
      display: 'flex', 
      justifyContent: 'flex-end', 
      gap: 1
    }
  };

  // Card view for mobile and tablet
  const renderCardView = () => {
    return (
      <Box {...containerProps} sx={{ width: '100%', ...containerProps.sx }}>
        {data.map((item, index) => (
          <Card key={index} sx={{ ...commonStyles.card, ...cardProps.sx }} {...cardProps}>
            <CardContent sx={{ p: 2 }}>
              {columns.map((column) => (
                <Box key={column.field} sx={commonStyles.cardItem}>
                  <Typography variant="subtitle2" color="text.secondary" sx={commonStyles.cardLabel}>
                    {column.headerName}:
                  </Typography>
                  <Typography variant="body2" align="right" sx={commonStyles.cardValue}>
                    {column.renderCell 
                      ? column.renderCell({ value: item[column.field], row: item })
                      : item[column.field]}
                  </Typography>
                </Box>
              ))}
              
              {renderActions && (
                <Box sx={commonStyles.actionsContainer}>
                  {renderActions(item)}
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };
  
  // Common styles for table headers and rows
  const tableStyles = {
    headerCell: {
      fontWeight: 'bold',
      backgroundColor: (theme) => theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.02)'
    },
    tableRow: {
      '&:nth-of-type(odd)': {
        backgroundColor: (theme) => theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.02)' 
          : 'rgba(0, 0, 0, 0.01)'
      },
      '&:hover': {
        backgroundColor: (theme) => theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.04)'
      },
      transition: 'background-color 0.2s'
    }
  };

  // Get theme for styling
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Table view for desktop
  const renderTableView = () => {
    
    return (
      <TableContainer 
        component={Paper} 
        {...containerProps} 
        sx={{ 
          borderRadius: '12px', 
          width: '100%',
          ...responsiveStyles.scrollbarStyles,
          ...containerProps.sx 
        }}
      >
        <Table {...tableProps} sx={{ minWidth: 650, ...tableProps.sx }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell 
                  key={column.field} 
                  align={column.align || 'left'} 
                  sx={tableStyles.headerCell}
                >
                  {column.headerName}
                </TableCell>
              ))}
              {renderActions && 
                <TableCell 
                  align="right" 
                  sx={tableStyles.headerCell}
                >
                  Actions
                </TableCell>
              }
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow 
                key={index} 
                sx={tableStyles.tableRow}
              >
                {columns.map((column) => (
                  <TableCell key={column.field} align={column.align || 'left'}>
                    {column.renderCell 
                      ? column.renderCell({ value: item[column.field], row: item })
                      : item[column.field]}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                      {renderActions(item)}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  return showCardView ? renderCardView() : renderTableView();
};

export default ResponsiveDataView;