import React from "react";

export function PageHeader({
  badge,
  activeBadge,
  title,
  subtitle,
  children,
  actions,
  className = "",
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-white p-7 sm:p-8 shadow-xs border border-slate-200/80 ${className}`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          {(badge || activeBadge) && (
            <div className="flex flex-wrap items-center gap-2.5">
              {badge && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-[#8D0606] border border-rose-200/60">
                  {badge}
                </span>
              )}
              {activeBadge && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  {activeBadge}
                </span>
              )}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm font-medium text-slate-500 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {(actions || children) && (
          <div className="flex items-center gap-3 shrink-0">
            {actions || children}
          </div>
        )}
      </div>
    </div>
  );
}
