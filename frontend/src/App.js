import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import FileManager from './pages/FileManager';
import FileDetails from './pages/FileDetails';
import Charts from './pages/Charts';
import ChartCreator from './pages/ChartCreator';
import ChartViewer from './pages/ChartViewer';
import ChartEdit from './pages/ChartEdit';
import Profile from './pages/Profile';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Context
import { AuthProvider } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  let user = null;
  
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  // Initialize darkMode from user preferences in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        return user?.preferences?.settings?.darkModeDefault || false;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return false;
      }
    }
    return false;
  });
  
  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Listen for changes to user preferences
  useEffect(() => {
    const handlePreferencesChange = (event) => {
      const { preferences } = event.detail;
      if (preferences && preferences.settings) {
        setDarkMode(preferences.settings.darkModeDefault || false);
      }
    };
    
    // Listen for custom userPreferencesChanged event
    window.addEventListener('userPreferencesChanged', handlePreferencesChange);
    
    return () => {
      window.removeEventListener('userPreferencesChanged', handlePreferencesChange);
    };
  }, []);
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          {/* Flex container for the entire app with min-height of viewport */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            position: 'relative',
            width: '100%'
          }}>
            <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            {/* Main content area that will grow to push footer down */}
            <Box sx={{ 
              flex: '1 0 auto',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              pb: 2 // Reduced padding at the bottom since footer will flow naturally
            }}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/files" element={
                  <ProtectedRoute>
                    <FileManager />
                  </ProtectedRoute>
                } />
                <Route path="/files/:id" element={
                  <ProtectedRoute>
                    <FileDetails />
                  </ProtectedRoute>
                } />
                <Route path="/charts" element={
                  <ProtectedRoute>
                    <Charts />
                  </ProtectedRoute>
                } />
                <Route path="/charts/create" element={
                  <ProtectedRoute>
                    <ChartCreator />
                  </ProtectedRoute>
                } />
                <Route path="/charts/:id" element={
                  <ProtectedRoute>
                    <ChartViewer />
                  </ProtectedRoute>
                } />
                <Route path="/charts/edit/:id" element={
                  <ProtectedRoute>
                    <ChartEdit />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                {/* Add more routes as needed */}
              </Routes>
            </Box>
            {/* Footer that will stay at the bottom */}
            <Footer />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
