import React from "react";
import { CalendarDays, ChevronDown, Search } from "lucide-react";

export function SearchFilterRow({
  calendarTone = "blue",
  searchQuery = "",
  onSearchChange,
  dateLabel = "Filter Period",
  dateRange = "17 April 2024 - 21 May 2024",
}) {
  const redTone = calendarTone === "red";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex h-12 w-full max-w-md items-center rounded-xl border border-slate-200 bg-white px-4 shadow-xs transition focus-within:border-[#8D0606] focus-within:ring-2 focus-within:ring-[#8D0606]/10">
        <Search size={18} className="text-slate-400 shrink-0 mr-2.5" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400"
          placeholder="Search by order ID, customer, or location..."
        />
      </div>

      {/* Date Filter Dropdown Button */}
      <button
        className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-left shadow-xs transition hover:bg-slate-50"
        type="button"
      >
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg ${
            redTone ? "bg-[#8D0606] text-white" : "bg-sky-50 text-sky-600 border border-sky-100"
          }`}
        >
          <CalendarDays size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-slate-700">{dateLabel}</span>
          <span className="block text-[11px] font-normal text-slate-400 truncate">{dateRange}</span>
        </div>
        <ChevronDown className="text-slate-400 shrink-0" size={16} />
      </button>
    </div>
  );
}
