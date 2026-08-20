import React from "react";
import { Power, CheckCircle2, XCircle, Radio } from "lucide-react";

export function StatusInput({
  checked,
  onChange,
  label,
  description,
  activeLabel = "ONLINE",
  inactiveLabel = "OFFLINE",
  icon: Icon = Power,
}) {
  const isChecked = Boolean(checked);

  return (
    <label className="group relative flex cursor-pointer select-none items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5 shadow-2xs transition-all duration-200 hover:border-[#8D0606] hover:shadow-md">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only"
      />

      {/* Left: Icon + Label/Description */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
            isChecked
              ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          <Icon size={20} className={isChecked && Icon === Radio ? "animate-pulse" : ""} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900 truncate">{label}</span>
          <span className="mt-0.5 block text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed">
            {description || (isChecked ? "Active & operational" : "Currently disabled")}
          </span>
        </div>
      </div>

      {/* Right: Badge & Toggle Switch */}
      <div className="flex items-center gap-3 shrink-0 pl-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-200 ${
            isChecked
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
              : "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"
          }`}
        >
          {isChecked ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          <span>{isChecked ? activeLabel : inactiveLabel}</span>
        </span>

        {/* Toggle Switch */}
        <div
          className={`relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0 ${
            isChecked ? "bg-[#8D0606]" : "bg-slate-200"
          }`}
        >
          <div
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
              isChecked ? "translate-x-5.5" : "translate-x-0.5"
            }`}
          />
        </div>
      </div>
    </label>
  );
}
