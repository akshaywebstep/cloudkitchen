import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  badge,
  activeBadge,
  title,
  subtitle,
  children,
  actions,
  className = "",
  onBack,
  showBack = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Show back arrow automatically on all pages except root dashboard unless explicitly specified
  const shouldShowBack = showBack && (onBack !== undefined ? !!onBack : location.pathname !== "/");

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-7 shadow-xs border border-slate-200/90 ${className}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2.5">
          {(badge || activeBadge) && (
            <div className="flex flex-wrap items-center gap-2">
              {badge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10.5px] sm:text-xs font-semibold text-[#8D0606] border border-rose-200/60">
                  {badge}
                </span>
              )}
              {activeBadge && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10.5px] sm:text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {activeBadge}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {shouldShowBack && (
              <button
                type="button"
                onClick={handleBack}
                className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-2xs transition hover:bg-[#8D0606] hover:text-white hover:border-[#8D0606] active:scale-95 cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-xs sm:text-[13px] font-normal text-slate-500 max-w-2xl leading-normal line-clamp-2 sm:line-clamp-none">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {(actions || children) && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 pt-1 lg:pt-0">
            {actions || children}
          </div>
        )}
      </div>
    </div>
  );
}
