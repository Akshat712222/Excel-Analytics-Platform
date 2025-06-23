import React, { useState, useContext } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper, useTheme, Stack } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { api } from '../utils/api';
import AuthContext from '../context/AuthContext';
import { responsiveStyles } from '../utils/responsiveUtils';

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [parseProgress, setParseProgress] = useState(0);
  const { token, user } = useContext(AuthContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const styles = {
    uploadBox: {
      border: `2px dashed ${isDarkMode ? theme.palette.primary.dark : theme.palette.primary.main}`,
      borderRadius: '12px',
      padding: { xs: '15px 12px', sm: '20px 15px', md: '25px 20px' },
      textAlign: 'center',
      marginBottom: '0',
      backgroundColor: isDarkMode ? 'rgba(21, 101, 192, 0.05)' : 'rgba(33, 150, 243, 0.03)',
      transition: 'all 0.3s ease',
      boxShadow: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: { xs: '200px', sm: '220px', md: '250px' },
      width: '100%',
      position: 'relative',
      flex: 1,
      '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: isDarkMode ? 'rgba(25, 118, 210, 0.1)' : 'rgba(33, 150, 243, 0.06)',
        boxShadow: isDarkMode ? '0 4px 8px rgba(0, 0, 0, 0.12)' : '0 4px 8px rgba(33, 150, 243, 0.08)',
      },
    },
    uploadIcon: {
      fontSize: 80,
      color: isDarkMode ? '#2196F3' : '#1565C0',
      marginBottom: '16px',
      opacity: 1,
      transition: 'all 0.3s ease',
      position: 'relative',
      zIndex: 1,
      filter: isDarkMode ? 'drop-shadow(0 0 12px rgba(33, 150, 243, 0.6))' : 'drop-shadow(0 4px 8px rgba(21, 101, 192, 0.3))',
      animation: 'float 3s ease-in-out infinite',
      '@keyframes float': {
        '0%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-8px)' },
        '100%': { transform: 'translateY(0px)' },
      },
    },
    hiddenInput: {
      display: 'none',
    },
    progressContainer: {
      marginTop: '16px',
      width: '100%',
      height: '120px',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box',
      position: 'relative',
    },
    textStyles: {
      position: 'relative',
      zIndex: 1,
      letterSpacing: '0.5px',
    },
    buttonStyles: responsiveStyles.buttonStyles(theme, isDarkMode).base,
    fileNameContainer: {
      width: '100%',
      height: '60px',
      minHeight: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '0 16px',
      marginBottom: '12px',
      position: 'relative',
      flexShrink: 0,
      flexGrow: 0,
    },
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setSelectedFile(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect({ target: { files: [file] } });
    }
  };

  const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      try {
        setParseProgress(10);
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            setParseProgress(30);
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            setParseProgress(50);
            const sheets = workbook.SheetNames.map(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
              const headers = jsonData.length > 0 ? jsonData[0] : [];
              const rows = jsonData.slice(1);
              return { name: sheetName, headers, data: rows };
            });
            setParseProgress(100);
            resolve({ fileName: file.name, fileSize: file.size, mimeType: file.type, sheets });
          } catch (error) {
            setError('Failed to parse Excel file. Please check the file format.');
            reject(error);
          }
        };
        reader.onerror = (error) => {
          setError('Error reading file. Please try again.');
          reject(error);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        setError('An unexpected error occurred while processing the file.');
        reject(error);
      }
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      const parsedData = await parseExcelFile(selectedFile);
      if (!parsedData || !parsedData.sheets.length) {
        setIsUploading(false);
        setError('No valid sheets found in the Excel file.');
        return;
      }
      setUploadProgress(60);
      console.log('Sending data to server:', JSON.stringify(parsedData).substring(0, 200) + '...');
      const response = await api.post('/api/uploads', parsedData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 40 + 60);
          setUploadProgress(progress);
        },
        timeout: 60000,
      });
      setUploadProgress(100);
      setIsUploading(false);
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (error) {
      setIsUploading(false);
      if (error.message === 'Network Error') setError('Network issue. Check your connection.');
      else if (error.response?.status === 413) setError('File too large. Try a smaller file.');
      else if (error.response?.status === 401) setError('Session expired. Please log in.');
      else setError(error.response?.data?.message || 'Upload failed. Try again.');
      console.error('Upload error:', error);
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      flex: 1,
      overflow: 'hidden'
    }}>
      <Box 
        sx={{ 
          ...styles.uploadBox, 
          position: 'relative',
          border: `2px dashed ${isDarkMode ? theme.palette.primary.dark : theme.palette.primary.main}`,
          backgroundColor: isDarkMode ? 'rgba(25, 118, 210, 0.08)' : 'rgba(33, 150, 243, 0.04)',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          width: '100%',
          width: '500px',
          maxWidth: '95%',
          flex: 1,
          minHeight: { xs: '200px', sm: '220px', md: '260px' },
          height: { xs: 'auto', md: '100%' },
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: isDarkMode ? 'rgba(25, 118, 210, 0.12)' : 'rgba(33, 150, 243, 0.08)',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(33, 150, 243, 0.1)',
          },
        }} 
        onDragOver={handleDragOver} 
        onDrop={handleDrop} 
        aria-label="Drop area for Excel files"
      >
        <Stack 
          direction="column" 
          spacing={1.5} 
          alignItems="center" 
          justifyContent="center" 
          sx={{ 
            height: '100%', 
            width: '100%', 
            padding: { xs: '8px', sm: '12px', md: '14px' }, 
            boxSizing: 'border-box', 
            display: 'flex', 
            flexDirection: 'column', 
            flexWrap: 'nowrap',
            flex: 1,
            minHeight: { xs: '160px', sm: '180px', md: '200px' },
            overflow: 'hidden'
          }}
        >
          <CloudUploadIcon 
            sx={{ 
              fontSize: 60,
              color: theme.palette.primary.main,
              marginBottom: '12px',
              opacity: 0.8,
              transition: 'all 0.3s ease',
              filter: isDarkMode ? 'drop-shadow(0 0 8px rgba(33, 150, 243, 0.4))' : 'drop-shadow(0 4px 8px rgba(21, 101, 192, 0.2))',
              animation: 'float 3s ease-in-out infinite',
              '@keyframes float': {
                '0%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-8px)' },
                '100%': { transform: 'translateY(0px)' },
              },
            }} 
          />
          <Box sx={{ 
            textAlign: 'center',
            width: '100%',
            width: '450px',
            maxWidth: '90%',
            margin: '0 auto'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.text.primary, 
                fontWeight: 'medium', 
                mb: 0.5,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
              title={selectedFile ? selectedFile.name : ''}
            >
              {selectedFile ? selectedFile.name : 'Drag and drop your Excel file here'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
                mb: 1
              }}
            >
              file example: XLS, XLSX
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
                mb: 2
              }}
            >
              or
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            component="label" 
            startIcon={<CloudUploadIcon />} 
            size="medium" 
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'medium',
              px: 3,
              py: 1,
              width: '180px',
              maxWidth: '100%',
              boxShadow: isDarkMode 
                ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                : '0 4px 8px rgba(33, 150, 243, 0.2)',
              '&:hover': {
                boxShadow: isDarkMode 
                  ? '0 6px 12px rgba(0, 0, 0, 0.5)' 
                  : '0 6px 12px rgba(33, 150, 243, 0.3)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              },
            }}
          >
            Browse Files
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileSelect} />
          </Button>
        </Stack>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2, 
            width: '100%',
            width: '500px',
         maxWidth: '95%',
            borderRadius: '8px', 
            '& .MuiAlert-icon': { fontSize: '1.25rem' },
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        mt: 3, 
        width: '500px',
        maxWidth: '95%',
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center'
      }}>
        {isUploading ? (
          <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.palette.text.secondary, 
                fontWeight: 'medium', 
                textAlign: 'center',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {parseProgress < 100 ? `Parsing file... ${parseProgress}%` : `Uploading... ${uploadProgress}%`}
            </Typography>
            <Box 
              component="div"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <CircularProgress 
                variant="determinate" 
                value={parseProgress < 100 ? parseProgress : uploadProgress} 
                sx={{ 
                  color: theme.palette.primary.main, 
                  '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }, 
                  width: '50px !important', 
                  height: '50px !important' 
                }} 
                thickness={4} 
              />
            </Box>
          </Stack>
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading} 
            fullWidth 
            size="large" 
            sx={{ 
              py: 1.5, 
              fontSize: '1rem', 
              fontWeight: 'medium', 
              width: '100%',
              maxWidth: '100%',
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: isDarkMode 
                ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                : '0 4px 8px rgba(33, 150, 243, 0.2)',
              '&:hover': {
                boxShadow: isDarkMode 
                  ? '0 6px 12px rgba(0, 0, 0, 0.5)' 
                  : '0 6px 12px rgba(33, 150, 243, 0.3)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              },
              '&.Mui-disabled': { 
                background: isDarkMode ? 'rgba(66, 66, 66, 0.9)' : 'rgba(0, 0, 0, 0.12)', 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)', 
                boxShadow: 'none' 
              }
            }}
          >
            Upload File
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default FileUpload;