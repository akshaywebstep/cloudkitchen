import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF5F2] via-white to-white pb-16 pt-12 sm:pt-20 lg:pb-24">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-40 size-96 rounded-full bg-amber-200/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Top Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F1DFDA] bg-white px-3.5 py-1.5 shadow-xs">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-medium uppercase tracking-wider text-[#8D0606]">
              Next-Gen Cloud Kitchen & Ghost Store OS
            </span>
            <span className="text-xs text-[#9C8D89] font-normal">• 14-Day Free Trial</span>
          </div>

          <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-normal text-[#2B1010] leading-tight">
            Scale Your Kitchen Operations with{" "}
            <span className="bg-gradient-to-r from-[#8D0606] via-[#B80808] to-[#D92525] bg-clip-text text-transparent font-bold">
              Precision & Profit
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#6E5B56] leading-relaxed font-normal">
            From real-time multi-brand order queues and recipe yield calculations to automated waste logging and staff permissions — run your entire cloud kitchen franchise in one unified dashboard.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="#pricing"
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] px-8 text-sm font-semibold text-white shadow-lg shadow-[#8D0606]/20 transition hover:from-[#7A0505] hover:to-[#a10707] active:scale-95"
            >
              <span>Explore Plans & Free Trial</span>
              <ArrowRight size={16} />
            </a>
            <Link
              to="/login"
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#E8DCD7] bg-white px-7 text-sm font-medium text-[#2B1010] shadow-xs transition hover:bg-[#FAF8F6] active:scale-95"
            >
              <span>Kitchen Owner Login</span>
            </Link>
          </div>

          {/* Key Trust Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-normal text-[#8A7873]">
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-emerald-600" />
              14-Day Free Trial
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-emerald-600" />
              Stripe 3DS Secure Checkout
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-emerald-600" />
              FSSAI & GST Compliance Ready
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-emerald-600" />
              Instant Dashboard Provisioning
            </span>
          </div>
        </div>

        {/* Live POS Preview Card */}
        <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-[#EDE2DC] bg-white p-3 shadow-xl shadow-rose-950/5">
          <div className="rounded-xl border border-slate-100 bg-[#FCFBFA] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-rose-400" />
                <div className="size-3 rounded-full bg-amber-400" />
                <div className="size-3 rounded-full bg-emerald-400" />
                <span className="ml-3 font-mono text-xs text-slate-500 font-normal">
                  operations.cloudkitchen.live
                </span>
              </div>
              <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                POS & Outlets Online
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                <p className="text-[11px] font-medium text-slate-400 uppercase">Live Orders</p>
                <p className="mt-1 text-xl font-bold text-[#8D0606]">184 Orders</p>
                <span className="text-[10.5px] font-medium text-emerald-600">↑ 14% vs yesterday</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                <p className="text-[11px] font-medium text-slate-400 uppercase">Active Outlets</p>
                <p className="mt-1 text-xl font-bold text-slate-800">4 Branches</p>
                <span className="text-[10.5px] font-normal text-slate-500">100% Operational</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                <p className="text-[11px] font-medium text-slate-400 uppercase">Recipe Stock Yield</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">92% Optimal</p>
                <span className="text-[10.5px] font-normal text-slate-500">0 Bottlenecks</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                <p className="text-[11px] font-medium text-slate-400 uppercase">Waste Prevented</p>
                <p className="mt-1 text-xl font-bold text-amber-700">$1,420</p>
                <span className="text-[10.5px] font-medium text-emerald-600">This month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
