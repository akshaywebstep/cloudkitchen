import React from "react";

export function Card({ children, className = "" }) {
  return <section className={`premium-card rounded-[20px] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.06)] ${className}`}>{children}</section>;
}

export function CardTitle({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13px] text-[#9a9a9a]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
