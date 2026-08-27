import React from 'react';
import { FileX, RefreshCw, FolderOpen, PackageSearch } from 'lucide-react';

export const EmptyState = ({
  title = "No data in current status",
  description = "We couldn't find any items matching your selected status filter or search query. Try clearing your search or picking a different filter tab.",
  onReset = null,
  resetLabel = "Clear Filter & Reset View"
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 md:p-14 shadow-card border border-slate-100 dark:border-slate-800 text-center space-y-5 animate-fade-in my-4">
      {/* Empty State Vector Badge Container */}
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-800/80 animate-pulse" />
        <div className="w-20 h-20 rounded-full bg-brand-50 dark:bg-slate-800 border-2 border-dashed border-brand-200 dark:border-slate-700 flex items-center justify-center relative z-10 shadow-sm">
          <PackageSearch className="w-10 h-10 text-brand-800 dark:text-rose-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow">
          <FileX className="w-4 h-4" />
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {onReset && (
        <div className="pt-2">
          <button
            onClick={onReset}
            className="px-5 py-2.5 rounded-2xl bg-brand-800 hover:bg-brand-900 text-white font-extrabold text-xs shadow-brand transition-all inline-flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            {resetLabel}
          </button>
        </div>
      )}
    </div>
  );
};
