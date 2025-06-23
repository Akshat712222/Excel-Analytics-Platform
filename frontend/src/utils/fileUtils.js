import { alpha } from '@mui/material/styles';

/**
 * Utility functions for file-related operations
 */

/**
 * Get the appropriate color for a file status chip
 * @param {string} status - The file status
 * @returns {string} The color name for MUI Chip component
 */
export const getStatusColor = (status) => {
  if (!status) return 'default';
  
  switch (status.toLowerCase()) {
    case 'processed':
    case 'complete':
    case 'completed':
      return 'success';
    case 'processing':
    case 'analyzing':
    case 'uploading':
      return 'info';
    case 'error':
    case 'failed':
      return 'error';
    case 'pending':
    case 'queued':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Get the appropriate color for a file icon based on file type
 * @param {string} fileType - The file type/extension
 * @param {object} theme - The MUI theme object
 * @returns {string} The color for the file icon
 */
export const getFileIconColor = (fileType, theme) => {
  if (!fileType) return theme.palette.grey[500];
  
  const type = fileType.toLowerCase();
  
  if (type.includes('excel') || type.includes('sheet') || type.includes('xls') || type.includes('csv')) {
    return theme.palette.success.main; // Green for Excel/CSV files
  } else if (type.includes('word') || type.includes('doc')) {
    return theme.palette.primary.main; // Blue for Word docs
  } else if (type.includes('pdf')) {
    return theme.palette.error.main; // Red for PDFs
  } else if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) {
    return theme.palette.warning.main; // Orange/Yellow for images
  } else {
    return theme.palette.grey[500]; // Grey for other files
  }
};

/**
 * Re-export alpha from MUI for convenience
 */
export { alpha };