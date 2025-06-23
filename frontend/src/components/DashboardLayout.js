import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import {
  SpaceDashboardRounded as DashboardIcon,
  CloudUploadRounded as UploadIcon,
  InsertChartRounded as AnalyticsIcon,
  SettingsOutlined as SettingsIcon,
  AdminPanelSettingsRounded as AdminIcon,
  LogoutRounded as LogoutIcon,
  GridViewRounded as GridIcon,
  CloseRounded as CloseIcon
} from '@mui/icons-material';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
  const profileDropdownRef = useRef(null);
  
  // Handle click outside to close profile dropdown
  useOnClickOutside(profileDropdownRef, () => setProfileDropdownOpen(false));
  
  // Detect scroll for navbar background effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Animation variants for sidebar items
  const sidebarItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut'
      }
    })
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon, description: 'Overview of your analytics' },
    { name: 'Uploads', href: '/uploads', icon: UploadIcon, description: 'Manage your uploaded files' },
    { name: 'Analytics', href: '/analytics', icon: AnalyticsIcon, description: 'View detailed analytics' },
    { name: 'Settings', href: '/profile', icon: SettingsIcon, description: 'Configure your account' },
  ];

  // Add admin links if user is admin
  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: AdminIcon, description: 'Admin controls' });
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar for mobile */}
      <div className={`
        fixed inset-0 z-40 lg:hidden
        ${sidebarOpen ? 'block' : 'hidden'}
      `}>
        {/* Sidebar backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-90"
          onClick={toggleSidebar}
        ></motion.div>
        
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 left-0 flex flex-col w-72 max-w-xs bg-white dark:bg-gray-800 shadow-xl rounded-r-xl overflow-hidden"
        >
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-primary-500 dark:bg-primary-600">
            <span className="text-xl font-poppins font-semibold text-white">Excel Analytics</span>
            <button 
              onClick={toggleSidebar}
              className="text-white hover:text-gray-200 focus:outline-none p-1 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors duration-200"
            >
              <CloseIcon sx={{ fontSize: 24 }} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="px-4 py-6 space-y-2">
              {navigation.map((item, i) => {
                const isActive = location.pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={sidebarItemVariants}
                  >
                    <Link
                      to={item.href}
                      className={`
                        flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                        ${isActive
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-300 dark:border-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                      `}
                    >
                      <span className={`mr-3 flex items-center justify-center w-8 h-8 rounded-md ${isActive ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {React.createElement(item.icon, { sx: { fontSize: 20 } })}
                      </span>
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        {isActive && (
                          <motion.span 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                          >
                            {item.description}
                          </motion.span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>
          {isAuthenticated && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white shadow-md">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.name}</p>
                  <button 
                    onClick={logout}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-md">
            <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-700 dark:to-primary-600">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-md bg-white bg-opacity-20 flex items-center justify-center shadow-lg border border-white border-opacity-30">
                  <GridIcon sx={{ fontSize: 22, color: 'white' }} />
                </div>
                <span className="text-xl font-poppins font-semibold text-white">Excel Analytics</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item, i) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={sidebarItemVariants}
                    >
                      <Link
                        to={item.href}
                        className={`
                          flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                          ${isActive
                            ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500 dark:bg-primary-900 dark:bg-opacity-30 dark:text-primary-300 dark:border-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                        `}
                      >
                        <span className={`mr-3 flex items-center justify-center w-8 h-8 rounded-md ${isActive ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {React.createElement(item.icon, { sx: { fontSize: 20 } })}
                        </span>
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          {isActive && (
                            <motion.span 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                            >
                              {item.description}
                            </motion.span>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
            </div>
            {isAuthenticated && (
              <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 flex items-center justify-center text-white shadow-md">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.name}</p>
                  <div className="flex space-x-3 mt-1">
                    <Link 
                      to="/profile"
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 flex items-center hover:translate-x-1"
                    >
                      <SettingsIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Profile
                    </Link>
                    <button 
                      onClick={logout}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 flex items-center hover:translate-x-1"
                    >
                      <LogoutIcon sx={{ fontSize: 14, mr: 0.5 }} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 lg:hidden ${scrolled ? 'bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80 backdrop-blur-md shadow-md' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 dark:text-gray-400 focus:outline-none focus:text-primary-600 dark:focus:text-primary-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg hover:scale-105"
              aria-label="Open menu"
            >
              <GridIcon sx={{ fontSize: 24 }} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-r from-primary-600 to-primary-500 flex items-center justify-center shadow-md">
                <GridIcon sx={{ fontSize: 18, color: 'white' }} />
              </div>
              <span className="text-xl font-poppins font-semibold text-gray-800 dark:text-white">Excel Analytics</span>
            </div>
            {isAuthenticated && (
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-8 h-8 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white shadow-md hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors duration-200"
                  aria-label="Open profile menu"
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Profile Settings
                      </Link>
                      <button 
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        {/* Main content area */}
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 pb-16 flex flex-col" /* Added pb-16 for footer space */
          style={{ minHeight: 'calc(100vh - 64px)', marginTop: '64px' }} /* Ensure minimum height for content area and add margin for fixed header */
          id="dashboard-main-content" /* Add ID for scroll detection */
        >
          <div className="container mx-auto flex-grow flex flex-col">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex-grow flex flex-col"
            >
              {children}
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;