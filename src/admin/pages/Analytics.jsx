import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Utensils, Clock, Download, ArrowDown, ArrowUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../context/ToastContext';

const CustomAnalyticsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-100 text-[11px] font-extrabold space-y-1 pointer-events-none">
        <p className="text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100 pb-1 mb-1">{label} Peak Volume</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8C0D0D]" />
          <span className="text-slate-600 font-semibold text-[10px]">Orders Placed:</span>
          <span className="font-black text-[#8C0D0D] text-xs">{payload[0]?.value} Orders</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-[11px] font-extrabold pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="text-slate-700 text-[10px] font-bold">{data.name}:</span>
          <span className="font-black text-slate-900 text-xs">{data.value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const Analytics = () => {
  const toast = useToast();

  const hourlyPeakData = [
    { hour: '11 AM', orders: 45 },
    { hour: '12 PM', orders: 120 },
    { hour: '1 PM', orders: 180 },
    { hour: '2 PM', orders: 95 },
    { hour: '6 PM', orders: 150 },
    { hour: '7 PM', orders: 240 },
    { hour: '8 PM', orders: 210 },
    { hour: '9 PM', orders: 110 },
  ];

  const categoryShare = [
    { name: 'Asian Bowls', value: 35, color: '#8C0D0D' },
    { name: 'Burgers', value: 25, color: '#0284C7' },
    { name: 'Pizzas', value: 20, color: '#EAB308' },
    { name: 'Drinks & Desserts', value: 20, color: '#10B981' },
  ];

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-card border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] border border-rose-100 dark:border-rose-900/50 flex items-center gap-1.5">
                Executive Analytics Engine
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Real-Time Data Streams
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Kitchen Performance & Revenue Analytics</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
              Deep-dive into sales metrics, prep times, category share, and hourly peak order volumes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success('Comprehensive analytics report downloaded (PDF)!')}
              className="px-5 py-3 rounded-2xl bg-[#8C0D0D] text-white hover:bg-rose-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export Report PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100/80 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-brand-50 text-brand-800">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Average Prep Time</span>
            <span className="text-2xl font-black text-slate-900">14.2 Mins</span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowDown className="w-3 h-3" />
              2.1 mins faster
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100/80 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-sky-50 text-sky-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Peak Order Velocity</span>
            <span className="text-2xl font-black text-slate-900">240 / Hr</span>
            <span className="text-[11px] text-sky-600 font-bold block mt-0.5">Dinner Rush (7:00 PM)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-100/80 flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Avg Ticket Size</span>
            <span className="text-2xl font-black text-slate-900">$34.80</span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUp className="w-3 h-3" />
              8.4% vs last week
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Peak Bar Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl shadow-card border border-slate-100/80">
          <h3 className="text-base font-bold text-slate-900 mb-4">Peak Ordering Hours Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyPeakData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip content={<CustomAnalyticsTooltip />} cursor={false} />
                <Bar dataKey="orders" fill="#8C0D0D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut Pie */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-card border border-slate-100/80 flex flex-col justify-between">
          <h3 className="text-base font-bold text-slate-900 mb-2">Category Sales Share</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryShare} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {categoryShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 mt-2">
            {categoryShare.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name} ({cat.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
