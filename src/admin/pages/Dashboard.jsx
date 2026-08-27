import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag, Truck, XCircle, DollarSign, Clock, ChefHat, Flame, Star,
  ArrowUpRight, ArrowDownRight, ChevronDown, Calendar as CalendarIcon,
  X, Check, Wallet, Calendar, Target, ArrowRight, Sparkles, Download, RefreshCw, Bike, PackageCheck,
  TrendingUp, BarChart3, Activity, Layers, Hammer, Construction,
  Loader2, AlertCircle, Building2, GitBranch, Utensils, Boxes, Eye, User, Phone, Mail, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, CartesianGrid, Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { getDashboardStatsApi } from '../services/api';

/* ─── Custom Tooltip for Trend Chart ─── */
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-semibold min-w-[170px] space-y-1.5 pointer-events-none">
      <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center justify-between">
        <span>{label}</span>
        <Activity className="w-3.5 h-3.5 text-rose-400" />
      </div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <span className="text-slate-300 text-xs font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || p.stroke || '#8C0D0D' }} />
            {p.name}:
          </span>
          <span className="font-black text-xs tracking-tight" style={{ color: p.color || p.stroke || '#fff' }}>
            {p.name === 'Revenue' ? `₹${p.value?.toLocaleString('en-IN')}` : `${p.value} orders`}
          </span>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { dateFilter, setDateFilter } = useApp();
  const toast = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Live Stats State
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Date Filter Modal State
  const now = new Date();
  const y = now.getFullYear(), mo = String(now.getMonth() + 1).padStart(2, '0'), day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${mo}-${day}`, firstOfMonth = `${y}-${mo}-01`;

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  const fmt = (s) => {
    if (!s) return '';
    const dt = new Date(s);
    return isNaN(dt) ? s : `${dt.getDate()} ${dt.toLocaleString('en-US', { month: 'short' })} ${dt.getFullYear()}`;
  };

  const getLast7 = () => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 7);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const getLast30 = () => {
    const dt = new Date();
    dt.setDate(dt.getDate() - 30);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const applyFilter = (e) => {
    e.preventDefault();
    const r = `${fmt(startDate)} – ${fmt(endDate)}`;
    setDateFilter(r);
    toast.success(`Date filter updated: ${r}`);
    setIsDateModalOpen(false);
  };

  const applyPreset = (lbl, s, e) => {
    setStartDate(s);
    setEndDate(e);
    const r = `${fmt(s)} – ${fmt(e)}`;
    setDateFilter(r);
    toast.success(`Filter: ${lbl}`);
    setIsDateModalOpen(false);
  };

  // Fetch Dashboard Stats API
  const fetchDashboardStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await getDashboardStatsApi();
      if (res && res.status === true && res.data) {
        setStats(res.data);
        if (isManualRefresh) {
          toast.success(res.message || 'Dashboard statistics updated!');
        }
      } else {
        const errMsg = res?.message || 'Failed to load dashboard statistics';
        setError(errMsg);
        if (isManualRefresh) toast.error(errMsg);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      const errMsg = err?.message || 'Failed to communicate with dashboard stats server.';
      setError(errMsg);
      if (isManualRefresh) toast.error(errMsg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardStats(false);
  }, [fetchDashboardStats]);

  // Export summary report simulation
  const handleExportReport = () => {
    toast.success('Executive Dashboard Report exported as CSV!');
  };

  /* Dynamic card styles */
  const cardBg = isDark ? 'bg-[#151c28] border-slate-800' : 'bg-white border-slate-100 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardInnerBg = isDark ? 'bg-[#1b2434] border-slate-800' : 'bg-slate-50 border-slate-200';

  // Destructure Data safely
  const overview = stats?.overview || {};
  const masterData = stats?.masterData || {};
  const ordersBreakdown = stats?.ordersBreakdown || {};
  const rawSalesTrend = stats?.salesTrend || [];
  const recentKitchens = stats?.recentKitchens || [];
  const recentOrders = stats?.recentOrders || [];
  const recentSubscriptions = stats?.recentSubscriptions || [];

  // Format sales trend data for chart
  const formattedSalesTrend = rawSalesTrend.map(item => {
    const dt = new Date(item.date);
    const label = !isNaN(dt)
      ? dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      : item.date;
    return {
      ...item,
      displayDate: label,
      revenue: item.revenue || 0,
      orders: item.orders || 0,
    };
  });

  // Calculate order status totals
  const statusPlaced = ordersBreakdown?.byStatus?.PLACED ?? 0;
  const statusPreparing = ordersBreakdown?.byStatus?.PREPARING ?? 0;
  const statusCompleted = ordersBreakdown?.byStatus?.COMPLETED ?? 0;
  const statusCancelled = ordersBreakdown?.byStatus?.CANCELLED ?? 0;
  const totalStatusCount = statusPlaced + statusPreparing + statusCompleted + statusCancelled || 1;

  // Calculate source totals
  const sourceManual = ordersBreakdown?.bySource?.MANUAL || { count: 0, totalAmount: 0 };
  const sourceSwiggy = ordersBreakdown?.bySource?.SWIGGY || { count: 0, totalAmount: 0 };
  const sourceZomato = ordersBreakdown?.bySource?.ZOMATO || { count: 0, totalAmount: 0 };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PLACED') return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    if (s === 'PREPARING' || s === 'COOKING') return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'ACTIVE') return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (s === 'CANCELLED' || s === 'INACTIVE') return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="min-h-screen space-y-6 transition-colors duration-200 animate-fade-in pb-12">
      
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Executive Command Center
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {overview.activeKitchens || 0} Kitchen Hubs Live
              </span>
              <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-extrabold text-[11px] border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                {overview.totalActiveStaff || 0} Active Staff
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Welcome back, Cloud Kitchen Command</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Real-time platform sales, kitchen hub analytics, and multi-branch order fulfillment overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchDashboardStats(true)}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 transition-all active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-[#8C0D0D] dark:text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleExportReport}
              className="px-4 py-2.5 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>

            <button
              onClick={() => setIsDateModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4 text-[#8C0D0D] dark:text-rose-400" />
              <span>{dateFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${cardBg} animate-pulse space-y-3`}>
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error Retry Card */}
      {!isLoading && error && (
        <div className={`rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Failed to Load Live Stats</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchDashboardStats(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all active:scale-95 shrink-0"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* ═══════════ ROW 1: PRIMARY 6 KPI STAT CARDS ═══════════ */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* 1. Total Gross Sales */}
          <div className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#8C0D0D] dark:text-rose-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                Revenue
              </span>
            </div>
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                ₹{overview.totalGrossSales?.toLocaleString('en-IN') ?? 0}
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">Total Gross Sales</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>₹{overview.monthGrossSales?.toLocaleString('en-IN') ?? 0} this month</span>
              </div>
            </div>
          </div>

          {/* 2. Total Platform Orders */}
          <div className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md">
                Orders
              </span>
            </div>
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                {overview.totalPlatformOrders?.toLocaleString('en-IN') ?? 0}
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">Platform Orders</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-sky-600 dark:text-sky-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{overview.todayOrders ?? 0} orders today</span>
              </div>
            </div>
          </div>

          {/* 3. Total Kitchens */}
          <div className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                Hubs
              </span>
            </div>
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                {overview.totalKitchens ?? 0}
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">Kitchen Hubs</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                <span>{overview.activeKitchens ?? 0} Active • {overview.pendingOnboardingKitchens ?? 0} Pending</span>
              </div>
            </div>
          </div>

          {/* 4. Total Branches */}
          <div className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                Branches
              </span>
            </div>
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                {overview.totalBranches ?? 0}
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">Live Outlets</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                <User className="w-3.5 h-3.5" />
                <span>{overview.totalActiveStaff ?? 0} Staff Active</span>
              </div>
            </div>
          </div>

          {/* 5. Subscription Revenue */}
          <div className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                SaaS
              </span>
            </div>
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                ₹{overview.subscriptionRevenue?.toLocaleString('en-IN') ?? 0}
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">SaaS Subscriptions</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>{overview.activeSubscriptions ?? 0} Active Plans</span>
              </div>
            </div>
          </div>

          {/* 6. Average Order Value */}
          <div className={`p-5 rounded-2xl border ${cardBg} flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                AOV
              </span>
            </div>
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                ₹{Number(overview.averageOrderValue || 0).toFixed(2)}
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">Avg Order Value</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Lifetime Metric</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MASTER CATALOG MINI METRICS ═══════════ */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/cuisines"
            className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between hover:border-[#8C0D0D]/40 transition-all group`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Registered Cuisines</p>
                <h4 className={`text-lg font-black ${textPrimary}`}>{masterData.totalCuisines ?? 0} Types</h4>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#8C0D0D] transition-colors" />
          </Link>

          <Link
            to="/admin/ingredients"
            className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between hover:border-[#8C0D0D]/40 transition-all group`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Inventory Ingredients</p>
                <h4 className={`text-lg font-black ${textPrimary}`}>{masterData.totalIngredients ?? 0} Items</h4>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#8C0D0D] transition-colors" />
          </Link>

          <Link
            to="/admin/foods"
            className={`p-4 rounded-2xl border ${cardBg} flex items-center justify-between hover:border-[#8C0D0D]/40 transition-all group`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-[#8C0D0D] dark:text-rose-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Menu Categories</p>
                <h4 className={`text-lg font-black ${textPrimary}`}>{masterData.totalMenuCategories ?? 0} Categories</h4>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#8C0D0D] transition-colors" />
          </Link>
        </div>
      )}

      {/* ═══════════ ROW 2: CHARTS & METRICS ═══════════ */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sales & Orders Velocity Chart (7 Cols) */}
          <div className={`lg:col-span-7 rounded-3xl border ${cardBg} p-6 flex flex-col justify-between`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-base font-black tracking-tight ${textPrimary} flex items-center gap-2`}>
                  <BarChart3 className="w-4 h-4 text-[#8C0D0D] dark:text-rose-400" />
                  Sales & Order Velocity (Last 7 Days)
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Daily revenue volume and placed order counts
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-[#8C0D0D] dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8C0D0D] dark:bg-rose-400" />
                  Revenue (₹)
                </span>
                <span className="flex items-center gap-1.5 text-sky-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Orders
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              {formattedSalesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedSalesTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8C0D0D" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8C0D0D" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                    <XAxis
                      dataKey="displayDate"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 }}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip content={<CustomTrendTooltip />} cursor={{ stroke: '#8C0D0D', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area
                      type="monotone"
                      name="Revenue"
                      dataKey="revenue"
                      stroke="#8C0D0D"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                      activeDot={{ r: 6, fill: '#8C0D0D', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      name="Orders"
                      dataKey="orders"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#0284c7' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                  No sales velocity records available for this period.
                </div>
              )}
            </div>
          </div>

          {/* Orders Status & Source Breakdown (5 Cols) */}
          <div className={`lg:col-span-5 rounded-3xl border ${cardBg} p-6 flex flex-col justify-between gap-6`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>
                  Order Pipeline & Fulfillment
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {overview.totalPlatformOrders ?? 0} Total Orders
                </span>
              </div>

              {/* Status Progress Meters */}
              <div className="space-y-3">
                {/* Placed */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Placed / Pending
                    </span>
                    <span className={textPrimary}>{statusPlaced} orders ({Math.round((statusPlaced / totalStatusCount) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, (statusPlaced / totalStatusCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Preparing */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5" /> Preparing in Kitchen
                    </span>
                    <span className={textPrimary}>{statusPreparing} orders ({Math.round((statusPreparing / totalStatusCount) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(statusPreparing / totalStatusCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Completed */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5" /> Completed / Delivered
                    </span>
                    <span className={textPrimary}>{statusCompleted} orders ({Math.round((statusCompleted / totalStatusCount) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(statusCompleted / totalStatusCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Cancelled */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Cancelled
                    </span>
                    <span className={textPrimary}>{statusCancelled} orders ({Math.round((statusCancelled / totalStatusCount) * 100)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${(statusCancelled / totalStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Source Distribution */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                Order Acquisition Channels
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-3 rounded-2xl ${cardInnerBg} text-center`}>
                  <p className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Direct / POS</p>
                  <p className={`text-base font-black mt-0.5 ${textPrimary}`}>₹{sourceManual.totalAmount?.toLocaleString('en-IN') || 0}</p>
                  <span className="text-[10px] font-bold text-slate-400">{sourceManual.count || 0} Orders</span>
                </div>

                <div className={`p-3 rounded-2xl ${cardInnerBg} text-center`}>
                  <p className="text-[10px] font-extrabold uppercase text-orange-600 dark:text-orange-400">Swiggy</p>
                  <p className={`text-base font-black mt-0.5 ${textPrimary}`}>₹{sourceSwiggy.totalAmount?.toLocaleString('en-IN') || 0}</p>
                  <span className="text-[10px] font-bold text-slate-400">{sourceSwiggy.count || 0} Orders</span>
                </div>

                <div className={`p-3 rounded-2xl ${cardInnerBg} text-center`}>
                  <p className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400">Zomato</p>
                  <p className={`text-base font-black mt-0.5 ${textPrimary}`}>₹{sourceZomato.totalAmount?.toLocaleString('en-IN') || 0}</p>
                  <span className="text-[10px] font-bold text-slate-400">{sourceZomato.count || 0} Orders</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════ ROW 3: RECENT ORDERS & RECENT KITCHENS ═══════════ */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Recent Orders Live Table (7 Cols) */}
          <div className={`lg:col-span-7 rounded-3xl border ${cardBg} p-6 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>
                    Recent Orders Stream
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Latest incoming orders across all active kitchens
                  </p>
                </div>
                <Link
                  to="/admin/orders"
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-[#8C0D0D] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Kitchen / Branch</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                    {recentOrders.length > 0 ? (
                      recentOrders.map((ord) => {
                        const custName = ord.customer
                          ? `${ord.customer.firstName || ''} ${ord.customer.lastName || ''}`.trim() || 'Direct Customer'
                          : 'Walk-in Customer';
                        const kitchenName = ord.user?.kitchenName || 'Central Kitchen';
                        const branchName = ord.branch?.name || 'Main Branch';

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 font-extrabold text-[#8C0D0D] dark:text-rose-400">
                              #{ord.id}
                            </td>
                            <td className="py-3">
                              <span className={`font-bold block ${textPrimary}`}>{custName}</span>
                              <span className="text-[10px] text-slate-400">{ord.source || 'MANUAL'}</span>
                            </td>
                            <td className="py-3">
                              <span className={`font-semibold block ${textPrimary}`}>{kitchenName}</span>
                              <span className="text-[10px] text-slate-400">{branchName}</span>
                            </td>
                            <td className="py-3 font-black text-slate-900 dark:text-white">
                              ₹{ord.totalAmount?.toLocaleString('en-IN') ?? 0}
                            </td>
                            <td className="py-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(ord.status)}`}>
                                {ord.status || 'PLACED'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-400 font-bold">
                          No recent orders available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Kitchens Onboarded (5 Cols) */}
          <div className={`lg:col-span-5 rounded-3xl border ${cardBg} p-6 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>
                    Onboarded Kitchen Hubs
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Newly registered cloud kitchen accounts
                  </p>
                </div>
                <Link
                  to="/admin/kitchens"
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-[#8C0D0D] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <span>Kitchens</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentKitchens.length > 0 ? (
                  recentKitchens.slice(0, 4).map((k) => (
                    <div
                      key={k.id}
                      className={`p-3.5 rounded-2xl ${cardInnerBg} flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#8C0D0D]/10 text-[#8C0D0D] dark:text-rose-400 flex items-center justify-center font-black shrink-0">
                          {k.kitchenName ? k.kitchenName.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`font-extrabold text-xs truncate ${textPrimary}`}>
                            {k.kitchenName || 'Unnamed Kitchen'}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {k.email || 'No email'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getStatusBadge(k.status)}`}>
                          {k.status || 'ACTIVE'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {k.branches?.length || 0} Outlets
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 font-bold text-xs">
                    No kitchens registered yet.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════ ROW 4: RECENT SUBSCRIPTIONS ═══════════ */}
      {!isLoading && (
        <div className={`rounded-3xl border ${cardBg} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>
                Recent Subscription Enrollments
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Active recurring billing subscriptions from kitchen operators
              </p>
            </div>
            <Link
              to="/admin/subscriptions"
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-[#8C0D0D] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>Manage Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {recentSubscriptions.length > 0 ? (
              recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-2xl ${cardInnerBg} space-y-2 hover:border-[#8C0D0D]/40 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-brand-50 dark:bg-brand-950 text-brand-800 dark:text-brand-300">
                      {sub.subscription?.name || 'Plan'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(sub.status)}`}>
                      {sub.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div>
                    <h4 className={`font-black text-sm truncate ${textPrimary}`}>
                      {sub.kitchen?.kitchenName || 'Kitchen Plan'}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{sub.kitchen?.email}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹{sub.pricePaid?.toLocaleString('en-IN') || 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      {sub.billingCycle || 'MONTHLY'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-6 text-center text-slate-400 font-bold text-xs">
                No active subscriptions recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ DATE FILTER MODAL ═══════════ */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full overflow-hidden animate-modal-pop">
            <div className="bg-gradient-to-r from-[#8C0D0D] to-[#600808] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-300" />
                  Select Dashboard Date Range
                </h3>
                <p className="text-[11px] text-brand-200 mt-0.5">Filter all command center metrics</p>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase tracking-wider mb-2 font-extrabold text-[10px]">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('Today', todayStr, todayStr)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-center font-bold cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Last 7 Days', getLast7(), todayStr)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-center font-bold cursor-pointer"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Last 30 Days', getLast30(), todayStr)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-center font-bold cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('This Month', firstOfMonth, todayStr)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-center font-bold cursor-pointer"
                  >
                    This Month
                  </button>
                </div>
              </div>

              <form onSubmit={applyFilter} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold text-[11px]">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold text-[11px]">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#8C0D0D] hover:bg-rose-900 text-white font-extrabold shadow-md cursor-pointer"
                  >
                    Apply Range
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};