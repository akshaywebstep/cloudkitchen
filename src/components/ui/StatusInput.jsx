import React from "react";
import { Check, Power, CheckCircle2, XCircle } from "lucide-react";

export function StatusInput({ checked, onChange, label, description }) {
  const isChecked = Boolean(checked);

  return (
    <label className="group relative flex cursor-pointer select-none items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-4 transition-all duration-200 hover:border-[#8D0606] hover:shadow-md">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only"
      />
      
      <div className="flex items-center gap-3.5">
        <div
          className={`grid size-11 place-items-center rounded-xl transition-all duration-200 ${
            isChecked
              ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          <Power size={20} />
        </div>
        <div>
          <span className="block text-sm font-bold text-[#0f172a]">{label}</span>
          <span className="mt-0.5 block text-xs font-semibold text-[#64748b]">
            {description || (isChecked ? "Active & operational" : "Currently disabled")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 ${
            isChecked
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {isChecked ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          <span>{isChecked ? "ONLINE" : "OFFLINE"}</span>
        </span>

        {/* Toggle Switch */}
        <div
          className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
            isChecked ? "bg-[#8D0606]" : "bg-slate-300"
          }`}
        >
          <div
            className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isChecked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </div>
      </div>
    </label>
  );
}
