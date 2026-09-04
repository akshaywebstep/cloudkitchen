import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Login } from '../pages/Login';
import { ResetPassword } from '../pages/ResetPassword';
import { Dashboard } from '../pages/Dashboard';
import { Order } from '../pages/Order';
import { Customer } from '../pages/Customer';
import { Analytics } from '../pages/Analytics';
import { Reviews } from '../pages/Reviews';
import { Foods } from '../pages/Foods';
import { FoodDetail } from '../pages/FoodDetail';
import { Calendar } from '../pages/Calendar';
import { Chat } from '../pages/Chat';
import { Wallet } from '../pages/Wallet';
import { Kitchens } from '../pages/Kitchens';
import { Branches } from '../pages/Branches';
import { Cuisines } from '../pages/Cuisines';
import { MenuCategories } from '../pages/MenuCategories';
import { Ingredients } from '../pages/Ingredients';
import { WasteManagement } from '../pages/WasteManagement';
import { Subscriptions } from '../pages/Subscriptions';
import { useApp } from '../context/AppContext';
import { Loader2, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

// Premium full screen loader during auth check
const AuthLoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white p-4">
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-800/20 rounded-full blur-[140px] pointer-events-none" />
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 max-w-sm w-full text-center relative z-10">
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl ring-4 ring-[#8C0D0D]/40">
          <img src={logoImg} alt="Cloud Kitchen Logo" className="w-full h-full object-cover" />
        </div>
        <Loader2 className="w-28 h-28 text-[#8C0D0D] animate-spin absolute -inset-4 opacity-75" />
      </div>
      <div className="space-y-1">
        <h3 className="font-black text-xl tracking-tight text-white">Cloud Kitchen Admin</h3>
        <p className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5 mt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 inline" />
          Verifying security token...
        </p>
      </div>
    </div>
  </div>
);

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthChecking } = useApp();
  const location = useLocation();

  if (isAuthChecking) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

// Login Route Guard (redirects to admin dashboard if already authenticated)
const LoginRoute = () => {
  const { isAuthenticated, isAuthChecking } = useApp();

  if (isAuthChecking) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Login />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Unauthenticated Admin Routes */}
      <Route path="login" element={<LoginRoute />} />
      <Route path="reset-password" element={<ResetPassword />} />

      {/* Main Admin Application Routes (Protected inside MainLayout) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="kitchens" element={<Kitchens />} />
                <Route path="branches" element={<Branches />} />
                <Route path="cuisines" element={<Cuisines />} />
                <Route path="menu-categories" element={<MenuCategories />} />
                <Route path="ingredients" element={<Ingredients />} />
                <Route path="waste" element={<WasteManagement />} />
                <Route path="orders" element={<Order />} />
                <Route path="foods" element={<Foods />} />
                <Route path="menu-items" element={<Foods />} />
                <Route path="food-detail" element={<FoodDetail />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="chat" element={<Chat />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
