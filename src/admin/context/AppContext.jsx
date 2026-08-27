import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, verifyTokenApi } from '../services/api';

const defaultContextValue = {
  searchQuery: '',
  setSearchQuery: () => {},
  dateFilter: '',
  setDateFilter: () => {},
  isAddMenuOpen: false,
  setIsAddMenuOpen: () => {},
  isSidebarOpen: false,
  setIsSidebarOpen: () => {},
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: () => {},
  selectedBranch: '',
  setSelectedBranch: () => {},
  isAuthenticated: true,
  isAuthChecking: false,
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  verifySession: async () => false,
};

const AppContext = createContext(defaultContextValue);

export const AppProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('17 April 2024 - 21 May 2024');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Downtown Cloud Kitchen #1');

  // Auth state management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [user, setUser] = useState(null);

  const formatUserData = (adminData) => {
    if (!adminData) return null;
    const nameStr = adminData.email ? adminData.email.split('@')[0] : 'admin';
    const formattedName = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
    return {
      ...adminData,
      name: formattedName,
      email: adminData.email,
      role: adminData.userType || 'Super Admin',
      avatar: adminData?.profile || null,
    };
  };

  // Verify stored token on app initialization / page reload
  const verifySession = useCallback(async () => {
    setIsAuthChecking(true);
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsAuthChecking(false);
      return false;
    }

    try {
      const res = await verifyTokenApi(token);
      if (res && res.status === true) {
        setIsAuthenticated(true);
        setUser(formatUserData(res.admin));
        setIsAuthChecking(false);
        return true;
      } else {
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
        setUser(null);
        setIsAuthChecking(false);
        return false;
      }
    } catch (err) {
      localStorage.removeItem('admin_token');
      setIsAuthenticated(false);
      setUser(null);
      setIsAuthChecking(false);
      return false;
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (username, password) => {
    setIsAuthChecking(true);
    try {
      const res = await loginApi(username, password);
      if (res && res.status === true && res.data?.token) {
        localStorage.setItem('admin_token', res.data.token);
        setIsAuthenticated(true);
        setUser(formatUserData(res.data.admin));
        setIsAuthChecking(false);
        return { success: true, message: res.message || 'Login successful' };
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsAuthChecking(false);
        return {
          success: false,
          message: res?.message || 'Login failed. Invalid username or password.',
          errors: res?.errors || res?.error,
        };
      }
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
      setIsAuthChecking(false);
      return {
        success: false,
        message: err.message || 'An error occurred during authentication.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        dateFilter,
        setDateFilter,
        isAddMenuOpen,
        setIsAddMenuOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        selectedBranch,
        setSelectedBranch,
        isAuthenticated,
        isAuthChecking,
        user,
        login,
        logout,
        verifySession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  return context || defaultContextValue;
};
