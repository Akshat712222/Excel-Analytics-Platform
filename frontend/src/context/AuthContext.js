import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Token is handled by api.js interceptors
  // We keep this effect for any direct axios calls not using our api utility
  useEffect(() => {
    if (token) {
      console.log('Token available:', token.substring(0, 20) + '...');
    } else {
      console.log('No token available');
    }
  }, [token]);

  // Load user from localStorage on initial load and validate token
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          // Set token in state and axios headers
          setToken(storedToken);
          
          // Validate token by making a request to the server
          try {
            // Set token in headers for this specific request
            const config = {
              headers: {
                'x-auth-token': storedToken
              }
            };
            
            // Make a request to validate the token
            await api.get('/api/auth/me', config);
            
            // If request succeeds, token is valid
            setUser(JSON.parse(storedUser));
            console.log('Token validated successfully');
            console.log('User loaded from localStorage:', JSON.parse(storedUser).email);
          } catch (tokenErr) {
            console.error('Token validation failed:', tokenErr.response?.data);
            // If token validation fails, clear token and user
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setError('Session expired. Please login again.');
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      
      // Store user data from registration response
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        // Fallback to fetching user data if not included in registration response
        try {
          const userRes = await api.get('/api/auth/me');
          setUser(userRes.data);
          localStorage.setItem('user', JSON.stringify(userRes.data));
        } catch (userErr) {
          console.error('Error fetching user data:', userErr);
        }
      }
      
      setToken(res.data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Login request URL:', '/api/auth/login');
      console.log('Login credentials:', { email, password: '********' });
      
      const res = await api.post('/api/auth/login', { email, password });
      console.log('Login response:', res.data);

      // Store token and user in localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      console.log('Token stored in localStorage:', res.data.token.substring(0, 20) + '...');
      
      // Update context state
      setToken(res.data.token);
      setUser(res.data.user);
      
      // Token is automatically set in api.js interceptors
      console.log('Token will be used in future API requests');
      
      return true;
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Update user profile
  const updateUserProfile = async (userId, profileData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/api/users/${userId}`, profileData);
      
      // Update user in state and localStorage
      const updatedUser = { ...user, ...res.data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      return { success: false, error: err.response?.data?.message || 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  };

  // Update user preferences
  const updateUserPreferences = async (userId, preferencesData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/api/users/${userId}/preferences`, preferencesData);
      
      // Update user in state and localStorage
      const updatedUser = { 
        ...user, 
        preferences: res.data.preferences 
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch a custom event to notify other components of the preference change
      window.dispatchEvent(new CustomEvent('userPreferencesChanged', {
        detail: { preferences: res.data.preferences }
      }));
      
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update preferences');
      return { success: false, error: err.response?.data?.message || 'Failed to update preferences' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        updateUserProfile,
        updateUserPreferences,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;