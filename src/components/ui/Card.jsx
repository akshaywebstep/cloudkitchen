import React from "react";

export function Card({ children, className = "" }) {
  return <section className={`premium-card rounded-[20px] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.06)] ${className}`}>{children}</section>;
}

export function CardTitle({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-base sm:text-lg lg:text-[20px] font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500 font-normal leading-normal">{subtitle}</p> : null}
      </div>
      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </div>
  );
}
