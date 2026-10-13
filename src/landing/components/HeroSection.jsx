import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles, Activity, Store, TrendingUp, DollarSign } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full max-w-full overflow-hidden bg-gradient-to-b from-[#FAF5F2] via-white to-white pb-12 pt-6 sm:pb-20 sm:pt-16 lg:pb-28 lg:pt-20">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-64 sm:size-96 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-40 size-64 sm:size-96 rounded-full bg-amber-200/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="mx-auto max-w-3xl text-center">
          {/* Top Tag - Clean 320px-proof badge */}
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-[#F1DFDA] bg-white px-2.5 py-1 sm:px-4 sm:py-1.5 shadow-xs text-center">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#8D0606]">
              Next-Gen Cloud Kitchen OS
            </span>
            <span className="text-[10px] sm:text-xs text-[#9C8D89] font-normal">
              • 14-Day Free Trial
            </span>
          </div>

          <h1 className="mt-4 sm:mt-6 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#2B1010] leading-[1.18] sm:leading-tight">
            Scale Your Kitchen Operations with{" "}
            <span className="bg-gradient-to-r from-[#8D0606] via-[#B80808] to-[#D92525] bg-clip-text text-transparent font-bold inline-block">
              Precision & Profit
            </span>
          </h1>

          <p className="mt-3 sm:mt-5 text-xs sm:text-base lg:text-lg text-[#6E5B56] leading-relaxed font-normal max-w-2xl mx-auto px-1">
            From real-time multi-brand order queues and recipe yield calculations to automated waste logging and staff permissions — run your entire cloud kitchen franchise in one unified dashboard.
          </p>

          {/* Action CTAs */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 max-w-xs sm:max-w-none mx-auto w-full">
            <a
              href="#pricing"
              className="flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-5 sm:px-8 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#8D0606]/20 transition hover:from-[#7A0505] hover:to-[#a10707] active:scale-95"
            >
              <span>Explore Plans & Free Trial</span>
              <ArrowRight size={14} className="shrink-0" />
            </a>
            <Link
              to="/kitchen/login"
              className="flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#E8DCD7] bg-white px-5 sm:px-7 text-xs sm:text-sm font-medium text-[#2B1010] shadow-xs transition hover:bg-[#FAF8F6] active:scale-95"
            >
              <span>Kitchen Owner Login</span>
            </Link>
          </div>

          {/* Key Trust Badges */}
          <div className="mt-7 sm:mt-10 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 md:gap-6 text-[10.5px] sm:text-xs font-normal text-[#8A7873] max-w-sm sm:max-w-none mx-auto">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/70 p-1 sm:p-0 min-w-0">
              <Check size={13} className="text-emerald-600 shrink-0" />
              <span className="truncate">14-Day Free Trial</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/70 p-1 sm:p-0 min-w-0">
              <Check size={13} className="text-emerald-600 shrink-0" />
              <span className="truncate">Stripe 3DS Secure</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/70 p-1 sm:p-0 min-w-0">
              <Check size={13} className="text-emerald-600 shrink-0" />
              <span className="truncate">FSSAI & GST Ready</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/70 p-1 sm:p-0 min-w-0">
              <Check size={13} className="text-emerald-600 shrink-0" />
              <span className="truncate">Instant Setup</span>
            </div>
          </div>
        </div>

        {/* Live POS Preview Card - Zero horizontal overflow on 320px */}
        <div className="mx-auto mt-8 sm:mt-14 max-w-5xl rounded-2xl sm:rounded-3xl border border-[#EDE2DC] bg-white p-1.5 sm:p-3.5 shadow-xl shadow-rose-950/5 w-full">
          <div className="rounded-xl border border-slate-100 bg-[#FCFBFA] p-2.5 sm:p-5 lg:p-6 w-full">
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-200/80 pb-2.5 sm:pb-4">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex items-center gap-1 shrink-0">
                  <div className="size-2 sm:size-3 rounded-full bg-rose-400" />
                  <div className="size-2 sm:size-3 rounded-full bg-amber-400" />
                  <div className="size-2 sm:size-3 rounded-full bg-emerald-400" />
                </div>
                <span className="ml-1 sm:ml-2 font-mono text-[9.5px] sm:text-xs text-slate-500 font-normal truncate max-w-[140px] xs:max-w-none">
                  operations.cloudkitchen.live
                </span>
              </div>
              <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-xs font-medium text-emerald-700 border border-emerald-200 shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </span>
            </div>

            <div className="mt-3 sm:mt-5 grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3 lg:gap-4">
              <div className="rounded-xl border border-slate-100 bg-white p-2 sm:p-3.5 shadow-xs min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[9.5px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                    Live Orders
                  </p>
                  <Activity size={12} className="text-[#8D0606] shrink-0 opacity-70" />
                </div>
                <p className="mt-0.5 sm:mt-1 text-base sm:text-xl lg:text-2xl font-bold text-[#8D0606] truncate">
                  184 Orders
                </p>
                <span className="text-[9.5px] sm:text-[10.5px] font-medium text-emerald-600 block truncate">
                  ↑ 14% vs yesterday
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-2 sm:p-3.5 shadow-xs min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[9.5px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                    Active Outlets
                  </p>
                  <Store size={12} className="text-slate-500 shrink-0 opacity-70" />
                </div>
                <p className="mt-0.5 sm:mt-1 text-base sm:text-xl lg:text-2xl font-bold text-slate-800 truncate">
                  4 Branches
                </p>
                <span className="text-[9.5px] sm:text-[10.5px] font-normal text-slate-500 block truncate">
                  100% Operational
                </span>
              </div>

              {/* Recipe Yield - Fits beautifully without '92% Opti...' truncation */}
              <div className="rounded-xl border border-slate-100 bg-white p-2 sm:p-3.5 shadow-xs min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[9.5px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                    Recipe Yield
                  </p>
                  <TrendingUp size={12} className="text-emerald-600 shrink-0 opacity-70" />
                </div>
                <div className="mt-0.5 sm:mt-1 flex items-baseline gap-1">
                  <span className="text-base sm:text-xl lg:text-2xl font-bold text-emerald-700">
                    92%
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-600">
                    Optimal
                  </span>
                </div>
                <span className="text-[9.5px] sm:text-[10.5px] font-normal text-slate-500 block truncate">
                  0 Bottlenecks
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-2 sm:p-3.5 shadow-xs min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[9.5px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                    Waste Saved
                  </p>
                  <DollarSign size={12} className="text-amber-600 shrink-0 opacity-70" />
                </div>
                <p className="mt-0.5 sm:mt-1 text-base sm:text-xl lg:text-2xl font-bold text-amber-700 truncate">
                  $1,420
                </p>
                <span className="text-[9.5px] sm:text-[10.5px] font-medium text-emerald-600 block truncate">
                  This month
                </span>
              </div>
            </div>

            {/* Quick Live Prep Stage Ticker - Clean single line on 320px */}
            <div className="mt-2.5 sm:mt-4 rounded-lg bg-slate-50/90 px-2 sm:px-2.5 py-1.5 sm:py-2 border border-slate-200/60 flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-slate-600 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                <span className="size-1.5 sm:size-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                <span className="font-semibold text-[#2B1010] shrink-0">Live KDS:</span>
                <span className="text-slate-600 truncate">Order #1048 (Wings Box) Ready</span>
              </div>
              <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-mono shrink-0">12s ago</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
