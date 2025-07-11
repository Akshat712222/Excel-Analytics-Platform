import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * Custom hook to use the authentication context
 * @returns {Object} Authentication context values
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};