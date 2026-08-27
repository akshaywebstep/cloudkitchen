import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UtensilsCrossed, Loader2 } from 'lucide-react';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    message: 'Cooking up data...',
  });

  const showLoading = useCallback((message = 'Cooking up data...') => {
    setLoadingState({ isLoading: true, message });
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState({ isLoading: false, message: '' });
  }, []);

  const loaderOverlay = loadingState.isLoading ? (
    <div className="fixed inset-0 z-[999990] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full border border-slate-100 dark:border-slate-800 text-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-[#8C0D0D] dark:text-rose-400 animate-pulse">
            <UtensilsCrossed className="w-8 h-8 animate-bounce text-[#8C0D0D]" />
          </div>
          <Loader2 className="w-20 h-20 text-[#8C0D0D] dark:text-rose-400 animate-spin absolute -inset-2 opacity-90" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-lg">Cloud Kitchen</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{loadingState.message}</p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <LoadingContext.Provider value={{ isLoading: loadingState.isLoading, showLoading, hideLoading }}>
      {children}
      {typeof document !== 'undefined' && loaderOverlay ? createPortal(loaderOverlay, document.body) : loaderOverlay}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
