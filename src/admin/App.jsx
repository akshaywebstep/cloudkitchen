import React from 'react';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './routes/AppRoutes';

export function AdminApp() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LoadingProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </LoadingProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default AdminApp;
