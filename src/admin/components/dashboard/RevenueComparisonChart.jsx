import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { revenueComparisonData } from '../../data/mockData';

const CustomRevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 text-[11px] font-extrabold space-y-1 pointer-events-none">
        <p className="text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
              {entry.name === 'year2024' ? '2024 Revenue' : '2025 Revenue'}:
            </span>
            <span className="font-black text-slate-900 dark:text-white text-xs">${entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const RevenueComparisonChart = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-card border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-between min-h-[360px]">
      {/* Header with Legends */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-extrabold text-[#8C0D0D] dark:text-rose-400">Total Revenue</h3>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>2024</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span>2025</span>
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="h-64 w-full relative">
        {/* Floating Callout Badges Matching Screenshot */}
        <div className="absolute top-[22%] left-[45%] bg-sky-100 dark:bg-slate-800 border border-sky-300 dark:border-slate-700 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-sm hidden sm:block pointer-events-none z-10">
          $ 38.753,00
        </div>

        <div className="absolute bottom-[32%] right-[25%] bg-rose-100 dark:bg-slate-800 border border-rose-300 dark:border-slate-700 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-sm hidden sm:block pointer-events-none z-10">
          $ 12.657,00
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueComparisonData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
              tickFormatter={(val) => `$${val / 1000}k`}
              domain={[0, 45000]}
            />
            <Tooltip content={<CustomRevenueTooltip />} cursor={false} />
            <Line
              type="monotone"
              dataKey="year2024"
              stroke="#0284C7"
              strokeWidth={3}
              dot={{ r: 3, fill: '#0284C7' }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="year2025"
              stroke="#8C0D0D"
              strokeWidth={3}
              dot={{ r: 3, fill: '#8C0D0D' }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
