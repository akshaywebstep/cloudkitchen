import React from 'react';
import { MoreVertical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const PieChartSection = () => {
  const { theme } = useTheme();

  const gauges = [
    { percent: 81, label: 'Total Order', color: '#D92525', bg: theme === 'dark' ? '#331010' : '#FEE2E2' },
    { percent: 22, label: 'Customer Growth', color: '#10B981', bg: theme === 'dark' ? '#064e3b' : '#D1FAE5' },
    { percent: 62, label: 'Total Revenue', color: '#38BDF8', bg: theme === 'dark' ? '#0c4a6e' : '#E0F2FE' },
  ];

  const renderDonut = (percent, color, bg) => {
    const radius = 38;
    const strokeWidth = 12;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke={bg}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute font-extrabold text-slate-800 dark:text-white text-base">{percent}%</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full min-h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Pie Chart</h3>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-800 focus:ring-brand-800" />
            <span>Chart</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            <span>Show Value</span>
          </label>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gauges Grid */}
      <div className="grid grid-cols-3 gap-2 text-center my-auto flex-1 items-center py-2">
        {gauges.map((g) => (
          <div key={g.label} className="flex flex-col items-center gap-2">
            {renderDonut(g.percent, g.color, g.bg)}
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight max-w-[90px]">
              {g.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
