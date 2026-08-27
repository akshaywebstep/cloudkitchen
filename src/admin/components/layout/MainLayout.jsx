import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AddMenuModal } from '../common/AddMenuModal';
import { useApp } from '../../context/AppContext';

export const MainLayout = ({ children }) => {
  const { isSidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-[#f3f4f8] dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area — shifts based on sidebar state */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-64'
        }`}
      >
        <Header />

        <main className="flex-1 p-6 md:p-8 max-w-[100%] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Add Menu Item Modal */}
      <AddMenuModal />
    </div>
  );
};
