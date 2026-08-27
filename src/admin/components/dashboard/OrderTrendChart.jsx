import React from 'react';
import { Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { weeklyOrderTrend } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';

export const OrderTrendChart = () => {
  const toast = useToast();

  const handleSaveReport = () => {
    toast.success('Order Trend report saved as PDF!');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-800 text-center text-xs">
          <p className="font-extrabold text-sky-400">{data.orders} Order</p>
          <p className="text-[10px] text-slate-400">Oct 18th, 2020</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full min-h-[360px]">
      {/* Top Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Chart Order</h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
            Lorem ipsum dolor sit amet, consectetur adip
          </p>
        </div>
        <button
          onClick={handleSaveReport}
          className="px-3.5 py-1.5 rounded-xl border border-brand-800 dark:border-rose-500 text-brand-800 dark:text-rose-400 text-xs font-bold hover:bg-brand-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Save Report
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full relative mt-2">
        {/* Floating Callout badge to match exact reference image UI */}
        <div className="absolute top-1 left-[52%] -translate-x-1/2 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl shadow-lg border border-sky-100 dark:border-slate-700 z-10 hidden sm:block text-center pointer-events-none">
          <span className="block text-xs font-extrabold text-slate-800 dark:text-white">456 Order</span>
          <span className="block text-[10px] font-semibold text-slate-400">Oct 18th, 2020</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyOrderTrend} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} />
            <YAxis hide domain={[0, 500]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#0284C7"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#orderGrad)"
              activeDot={{ r: 6, fill: '#0284C7', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
