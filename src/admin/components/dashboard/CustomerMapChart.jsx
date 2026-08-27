import React, { useState } from 'react';
import { ChevronDown, MoreVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { customerMapData } from '../../data/mockData';

const CustomMapTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 text-[11px] font-extrabold space-y-1 pointer-events-none">
        <p className="text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8C0D0D]" />
          <span className="text-slate-600 dark:text-slate-400 font-semibold text-[10px]">New Customers:</span>
          <span className="font-black text-[#8C0D0D] dark:text-rose-400 text-xs">{payload[0]?.value}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
          <span className="text-slate-600 dark:text-slate-400 font-semibold text-[10px]">Returning:</span>
          <span className="font-black text-amber-600 dark:text-amber-400 text-xs">{payload[1]?.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const CustomerMapChart = () => {
  const [filter, setFilter] = useState('Weekly');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-card border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-between min-h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Customer Map</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-white transition-colors">
              <span>{filter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={customerMapData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barGap={6}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomMapTooltip />} cursor={false} />
            <Bar dataKey="value1" fill="#8C0D0D" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="value2" fill="#EAB308" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
