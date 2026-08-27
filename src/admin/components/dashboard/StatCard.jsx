import React from 'react';
import { ArrowUpRight, ArrowDownRight, ClipboardList, PackageCheck, FileSpreadsheet, ShoppingBag, Check, X, ArrowDown } from 'lucide-react';

export const StatCard = ({ title, value, change, isPositive, period, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'orders':
        return (
          <div className="w-14 h-14 rounded-2xl bg-red-100/70 dark:bg-red-950/60 flex items-center justify-center relative shrink-0">
            <ClipboardList className="w-7 h-7 text-[#8C0D0D] dark:text-rose-400" />
            <span className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-xs">
              <ArrowDown className="w-2.5 h-2.5" />
            </span>
          </div>
        );
      case 'delivered':
        return (
          <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 flex items-center justify-center relative shrink-0">
            <PackageCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
              <Check className="w-2.5 h-2.5" />
            </span>
          </div>
        );
      case 'canceled':
        return (
          <div className="w-14 h-14 rounded-2xl bg-rose-100/70 dark:bg-rose-950/60 flex items-center justify-center relative shrink-0">
            <FileSpreadsheet className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow-xs">
              <X className="w-2.5 h-2.5" />
            </span>
          </div>
        );
      case 'revenue':
      default:
        return (
          <div className="w-14 h-14 rounded-2xl bg-rose-100/70 dark:bg-rose-950/60 flex items-center justify-center relative shrink-0">
            <ShoppingBag className="w-7 h-7 text-[#8C0D0D] dark:text-rose-400" />
            <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
              <Check className="w-2.5 h-2.5" />
            </span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
          {value}
        </h3>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{title}</p>
        <div className="flex items-center gap-1 mt-1 text-[11px]">
          <span
            className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {change}
          </span>
          <span className="text-slate-400 dark:text-slate-500 text-[10px]">{period}</span>
        </div>
      </div>
    </div>
  );
};
