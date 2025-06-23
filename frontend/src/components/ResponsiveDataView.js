import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
  Paper
} from '@mui/material';

/**
 * ResponsiveDataView - A reusable component for displaying data in either card or table format
 * based on screen size
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of data objects to display
 * @param {Array} props.columns - Array of column definitions with { field, headerName, renderCell, width }
 * @param {Function} props.getRowId - Function to get unique ID for each row (defaults to index)
 * @param {Object} props.tableProps - Additional props for the Table component
 * @param {Object} props.cardProps - Additional props for the Card components
 * @param {Object} props.containerProps - Props for the container
 * @param {Boolean} props.forceMobile - Force mobile view regardless of screen size
 * @param {Boolean} props.forceDesktop - Force desktop view regardless of screen size
 * @returns {React.ReactElement}
 */
const ResponsiveDataView = ({
  data = [],
  columns = [],
  getRowId = (row, index) => index,
  tableProps = {},
  cardProps = {},
  containerProps = {},
  forceMobile = false,
  forceDesktop = false
}) => {
  const theme = useTheme();
  const isMobile = forceMobile || useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = !forceMobile && !forceDesktop && useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Render mobile/tablet card view
  const renderCardView = () => (
    <Box sx={{ p: 2 }} {...containerProps}>
      <Grid container spacing={2}>
        {data.map((row, index) => (
          <Grid item xs={12} key={getRowId(row, index)}>
            <Card elevation={2} sx={{ borderRadius: '8px', ...cardProps.sx }} onClick={(e) => e.stopPropagation()}>
              <CardContent sx={{ pb: 1, ...(cardProps.contentSx || {}) }} onClick={(e) => e.stopPropagation()}>
                {columns.map((column, colIndex) => {
                  // Skip rendering action columns in card content
                  if (column.field === 'actions') return null;
                  
                  // For the first column (usually the title/name), render it prominently
                  if (colIndex === 0) {
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }} key={column.field} onClick={(e) => e.stopPropagation()}>
                        {column.renderIcon && column.renderIcon(row)}
                        <Typography variant="body1" sx={{ fontWeight: 'medium', flexGrow: 1, wordBreak: 'break-word' }} onClick={(e) => e.stopPropagation()}>
                          {column.renderCell ? column.renderCell(row) : row[column.field]}
                        </Typography>
                      </Box>
                    );
                  }
                  
                  // For other data columns, render in a grid
                  return (
                    <Grid item xs={6} key={column.field} sx={{ mb: 1 }} onClick={(e) => e.stopPropagation()}>
                      <Typography variant="caption" color="text.secondary" component="div" onClick={(e) => e.stopPropagation()}>
                        {column.headerName}
                      </Typography>
                      <Typography variant="body2" onClick={(e) => e.stopPropagation()}>
                        {column.renderCell ? column.renderCell(row) : row[column.field]}
                      </Typography>
                    </Grid>
                  );
                })}
              </CardContent>
              
              {/* Render action buttons if there's an actions column */}
              {columns.find(col => col.field === 'actions') && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }} onClick={(e) => e.stopPropagation()}>
                  {columns.find(col => col.field === 'actions').renderCell(row)}
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
  
  // Common styles for components
  const styles = {
    tableContainer: {
      overflowX: isTablet ? 'auto' : 'visible',
      '&::-webkit-scrollbar': { height: '8px' },
      '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }
    }
  };

  // Render desktop table view
  const renderTableView = () => (
    <TableContainer 
      component={Paper} 
      sx={{ 
        ...styles.tableContainer,
        ...(containerProps.sx || {})
      }}
    >
      <Table {...tableProps}>
        <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
          <TableRow>
            {columns.map((column) => (
              <TableCell 
                key={column.field} 
                align={column.field === 'actions' ? 'right' : 'left'}
                sx={{ width: column.width }}
              >
                {column.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={getRowId(row, index)} hover>
              {columns.map((column) => (
                <TableCell 
                  key={column.field} 
                  align={column.field === 'actions' ? 'right' : 'left'}
                >
                  {column.renderCell ? column.renderCell(row) : row[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return isMobile ? renderCardView() : renderTableView();
};

export default ResponsiveDataView;