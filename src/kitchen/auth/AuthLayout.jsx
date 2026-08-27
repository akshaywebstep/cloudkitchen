import React from "react";
import {
  ChefHat,
  ShoppingBag,
  Boxes,
  Building2,
  CheckCircle2,
  Star,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function AuthLayout({ children, title, subtitle, icon: Icon }) {
  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] text-[#191919]">
      {/* Left side: Premium Full-Bleed Culinary Experience with Floating Glass Widgets */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 xl:p-14 text-white lg:flex">
        {/* Full-bleed High-End Culinary Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=85')`,
          }}
        />

        {/* Sophisticated Dark Burgundy & Vignette Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2b0202]/95 via-[#180303]/80 to-black/65 backdrop-blur-[2px]" />

        {/* Soft Ambient Light Effects */}
        <div className="pointer-events-none absolute -left-16 -top-16 size-80 rounded-full bg-[#8D0606]/35 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-80 rounded-full bg-amber-500/20 blur-[100px]" />

        {/* Top Brand Logo Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white shadow-lg shadow-rose-950/40 border border-white/20">
              <ChefHat size={24} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Cloud Kitchen</span>
                <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider backdrop-blur-md">
                  POS
                </span>
              </h1>
              <p className="text-xs font-semibold text-white/70">
                Multi-Branch Management Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/15">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational Online</span>
          </div>
        </div>

        {/* Center Live Feature & Glassmorphism Showcase */}
        <div className="relative z-10 my-auto py-8 max-w-lg space-y-6">
          {/* Main Hook Headline */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md border border-white/20 mb-3">
              <Sparkles size={13} />
              <span>Smart Cloud POS & Kitchen Automation</span>
            </div>
            <h2 className="text-2xl xl:text-3xl font-black tracking-tight text-white leading-tight">
              Next-Gen Operating System for Modern Cloud Kitchens
            </h2>
            <p className="mt-2.5 text-xs xl:text-sm text-white/80 font-medium leading-relaxed">
              Automate recipe ingredient deductions, live delivery aggregator orders, and multiple outlet inventories effortlessly.
            </p>
          </div>

          {/* Floating Live Activity Cards */}
          <div className="space-y-3 pt-2">
            {/* Card 1: Live Order Pipeline */}
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/15 shadow-lg transition-transform hover:translate-x-1 duration-200">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Live Kitchen Order #ORD-2841</p>
                  <p className="text-[11px] text-white/70 font-medium">Paneer Butter Masala (x2) • Main Branch</p>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-500/25 border border-emerald-400/30 px-2.5 py-1 text-[10.5px] font-bold text-emerald-300">
                Preparing (8m)
              </span>
            </div>

            {/* Card 2: Automatic Recipe Deduction */}
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/15 shadow-lg transition-transform hover:translate-x-1 duration-200">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Boxes size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Auto Ingredient Deduction</p>
                  <p className="text-[11px] text-white/70 font-medium">Tomato 0.5 KG & Paneer 0.2 KG deducted</p>
                </div>
              </div>
              <span className="rounded-lg bg-amber-500/25 border border-amber-400/30 px-2.5 py-1 text-[10.5px] font-bold text-amber-300">
                Stock Synced
              </span>
            </div>

            {/* Card 3: Multi-Branch Hub */}
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-3.5 backdrop-blur-md border border-white/15 shadow-lg transition-transform hover:translate-x-1 duration-200">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Multi-Branch Network</p>
                  <p className="text-[11px] text-white/70 font-medium">Centralized menus, staff & sales reports</p>
                </div>
              </div>
              <span className="rounded-lg bg-sky-500/25 border border-sky-400/30 px-2.5 py-1 text-[10.5px] font-bold text-sky-300">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof & Trust Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-5 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <span className="font-bold text-white">4.9 / 5.0 Rating</span>
            <span className="text-white/50">•</span>
            <span className="text-white/70 font-medium hidden xl:inline">
              Trusted by 500+ commercial kitchens
            </span>
          </div>

          <span className="text-[11px] font-semibold text-white/50">
            © 2026 Cloud Kitchens
          </span>
        </div>
      </div>

      {/* Right side: Form Area */}
      <div className="flex w-full flex-col justify-center bg-[#fdfdfd] px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo Branding Header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#8D0606] text-white shadow-md">
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#8D0606]">Cloud Kitchen</h1>
              <p className="text-xs text-slate-500 font-semibold">Management Platform</p>
            </div>
          </div>

          <div className="mb-7">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-[#8D0606] to-[#b80808] text-white shadow-md shadow-rose-900/20">
                  <Icon size={20} />
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h2>
            </div>
            {subtitle ? <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-500">{subtitle}</p> : null}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
}