import axios from 'axios';

// Determine the base URL based on the environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, API requests will be sent to the same domain
    // Vercel will route them to the backend via the routes in vercel.json
    return '';
  } else {
    // In development, use the local backend server
    return 'http://localhost:5000';
  }
};

const API_BASE_URL = getBaseUrl();

// Create an axios instance with the base URL and improved configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // Default timeout of 45 seconds
  // Enable cross-site cookies if needed
  withCredentials: true
});

// Add retry functionality for failed requests
api.interceptors.request.use(config => {
  // Initialize retry count if not already set
  config.retryCount = config.retryCount || 0;
  return config;
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    // Log requests in development environment
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development environment
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    
    // Validate response data
    if (response.status !== 204 && !response.data) {
      console.warn('Empty response data received:', response.config.url);
    }
    
    return response;
  },
  (error) => {
    // Log error details
    console.error('API Response Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      error.userMessage = 'Your session has expired. Please log in again.';
    }
    
    // Handle network errors with more detailed diagnostics
    if (error.message === 'Network Error') {
      console.error('Network error detected. Server might be down or unreachable.');
      // Check if the user is online
      if (!navigator.onLine) {
        error.userMessage = 'You appear to be offline. Please check your internet connection and try again.';
      } else {
        error.userMessage = 'Unable to connect to the server. The server might be down or unreachable. Please try again later.';
      }
      // Add a timestamp to help with debugging
      error.timestamp = new Date().toISOString();
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout detected.');
      error.userMessage = 'Request timed out. The server is taking too long to respond. Please try again later.';
    }
    
    // Handle server errors (500)
    if (error.response && error.response.status >= 500) {
      error.userMessage = 'Server error occurred. Our team has been notified. Please try again later.';
      // Add more detailed info for debugging
      error.serverError = {
        status: error.response.status,
        url: error.config.url,
        method: error.config.method,
        timestamp: new Date().toISOString()
      };
    }
    
    // Handle not found errors (404)
    if (error.response && error.response.status === 404) {
      error.userMessage = 'The requested resource was not found. Please check the URL and try again.';
    }
    
    // Handle bad request errors (400)
    if (error.response && error.response.status === 400) {
      error.userMessage = error.response.data?.message || 'Invalid request. Please check your input and try again.';
    }
    
    // Add user-friendly message if not already set
    if (!error.userMessage) {
      error.userMessage = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
    }
    
    // Implement automatic retry for certain errors
    const config = error.config;
    
    // Enhanced retry logic for chart operations
    const isChartOperation = config.url && (
      config.url.includes('/api/charts') || 
      config.url.includes('/charts/')
    );
    
    // Determine max retries based on operation type
    const maxRetries = isChartOperation ? 5 : 3; // Increased retries for chart operations
    
    // Check if we're online before attempting retry
    const isOnline = navigator.onLine;
    
    // Only retry for network errors, timeouts, 5xx server errors, and 404 for chart operations
    const shouldRetry = (
      isOnline && // Only retry if we're online
      (error.message === 'Network Error' || 
       error.code === 'ECONNABORTED' || 
       (error.response && error.response.status >= 500) ||
       // Special case: retry for 404 errors on chart operations (might be due to timing issues)
       (isChartOperation && error.response && error.response.status === 404)) &&
      config.retryCount < maxRetries
    );
    
    if (shouldRetry) {
      // Increment retry count
      config.retryCount = config.retryCount + 1;
      
      // Create a new promise to handle the retry
      return new Promise((resolve) => {
        const isChartOperation = config.url && (
          config.url.includes('/api/charts') || 
          config.url.includes('/charts/')
        );
        const maxRetries = isChartOperation ? 5 : 3; // Match the updated values from above
        
        console.log(`Retrying request (${config.retryCount}/${maxRetries}): ${config.url}`);
        
        // Enhanced exponential backoff with jitter for better distribution
        // Base: 1s, 2s, 4s with +/- 100ms random jitter
        const baseBackoff = 1000 * Math.pow(2, config.retryCount - 1);
        const jitter = Math.random() * 200 - 100; // Random value between -100 and 100ms
        const backoffTime = baseBackoff + jitter;
        
        // For chart operations, add additional delay on first retry to allow for backend processing
        // Increased delay for chart operations to allow more time for backend processing
        const additionalDelay = isChartOperation ? 
          (config.retryCount === 1 ? 1000 : 500) : // More delay for chart operations
          0;
        
        // Add a connection verification step before retrying
        const verifyAndRetry = () => {
          // Double-check we're still online before actually retrying
          if (!navigator.onLine) {
            console.log('Device went offline, cancelling retry');
            return Promise.reject({
              ...error,
              userMessage: 'Network connection lost. Please check your internet connection and try again.'
            });
          }
          return api(config);
        };
        
        setTimeout(() => resolve(verifyAndRetry()), backoffTime + additionalDelay);
      });
    }
    
    return Promise.reject(error);
  }
);

// Export as both named and default export for backward compatibility
export { api };
export default api;