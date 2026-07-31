import React from "react";
import { UtensilsCrossed, ShieldCheck, Sparkles, ChefHat, Copyright } from "lucide-react";
import { foodImages } from "../../../constants/mockData";

export function AuthLayout({ children, title, subtitle, icon: Icon }) {
  return (
    <div className="flex min-h-screen w-full bg-[#0d0707] text-[#191919]">
      {/* Left side: Premium Visual Branding Banner (Hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3a0606] via-[#1c0303] to-[#0a0202] p-12 text-white lg:flex">
        {/* Background decorative elements */}
        <div className="absolute -left-20 -top-20 size-[380px] rounded-full bg-[#8D0606]/20 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 size-[420px] rounded-full bg-[#e63946]/15 blur-[120px]" />

        {/* Top Logo Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#8D0606] to-[#e63946] shadow-[0_8px_20px_rgba(141,6,6,0.4)]">
            <ChefHat size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold uppercase tracking-wider text-white">Cloud Kitchen</h1>
            <p className="text-xs font-medium text-white/50">Enterprise Kitchen Management System</p>
          </div>
        </div>

        {/* Center Image Collapsible Frame & Highlights */}
        <div className="relative z-10 my-auto py-8">
          <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
            <div className="relative h-64 overflow-hidden rounded-2xl">
              <img
                src={foodImages[0]}
                alt="Cloud Kitchen Showcase"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-black/60 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-amber-400" />
                  <span className="text-xs font-semibold text-white">Live Branch Sync Enabled</span>
                </div>
                <span className="rounded-full bg-[#8D0606] px-2.5 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">v2.4</span>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <UtensilsCrossed size={16} className="mx-auto mb-1 text-[#e63946]" />
                <span className="font-semibold text-white/80">Menu Control</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <ShieldCheck size={16} className="mx-auto mb-1 text-emerald-400" />
                <span className="font-semibold text-white/80">Secure APIs</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                <ChefHat size={16} className="mx-auto mb-1 text-amber-400" />
                <span className="font-semibold text-white/80">Multi-Branch</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Streamline Your Multi-Branch Operations
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Manage inventory, live order flows, ingredient stocks, and real-time sales reports all in one unified dashboard.
            </p>
          </div>
        </div>

        {/* Bottom Footer Quote */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Copyright size={12} />
            2026 Cloud Kitchens Inc.
          </span>
          <span>Designed for High Efficiency</span>
        </div>
      </div>

      {/* Right side: Form Area */}
      <div className="flex w-full flex-col justify-center bg-[#F7F6F6] px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo Branding Header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-11 place-items-center rounded-xl bg-[#8D0606] text-white">
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#8D0606]">Cloud Kitchen</h1>
              <p className="text-xs text-[#777]">Management Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#e63946] text-white shadow-[0_6px_16px_rgba(141,6,6,0.35)]">
                  <Icon size={20} />
                </div>
              )}
              <h2 className="text-3xl font-semibold tracking-tight text-[#191919]">{title}</h2>
            </div>
            {subtitle ? <p className="mt-2 text-sm font-medium text-[#777]">{subtitle}</p> : null}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
}