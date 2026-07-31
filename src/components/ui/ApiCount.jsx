import React from "react";

export function ApiCount({ label, value, icon: Icon, badge, color = "red" }) {
  const colorMap = {
    red: {
      bg: "bg-rose-50/50 hover:bg-rose-50 border-rose-100",
      iconBg: "bg-[#8D0606] text-white shadow-[0_4px_12px_rgba(141,6,6,0.2)]",
      valText: "text-[#8D0606]",
    },
    emerald: {
      bg: "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100",
      iconBg: "bg-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)]",
      valText: "text-emerald-700",
    },
    amber: {
      bg: "bg-amber-50/50 hover:bg-amber-50 border-amber-100",
      iconBg: "bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)]",
      valText: "text-amber-700",
    },
    sky: {
      bg: "bg-sky-50/50 hover:bg-sky-50 border-sky-100",
      iconBg: "bg-sky-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.2)]",
      valText: "text-sky-700",
    },
  };

  const scheme = colorMap[color] || colorMap.red;

  return (
    <div className={`relative flex items-center justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${scheme.bg}`}>
      <div>
        <span className="block text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className={`mt-1 block text-xl font-semibold tracking-tight ${scheme.valText}`}>
          {value}
        </span>
        {badge ? (
          <span className="mt-1.5 inline-block rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600 shadow-xs">
            {badge}
          </span>
        ) : null}
      </div>
      {Icon ? (
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-200 ${scheme.iconBg}`}>
          <Icon size={20} />
        </div>
      ) : null}
    </div>
  );
}
