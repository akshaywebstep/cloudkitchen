import React from "react";
import { Link } from "react-router-dom";
import { ChefHat, ArrowRight } from "lucide-react";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#F0E6E2] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#8D0606] to-[#b80808] text-white shadow-md">
            <ChefHat size={22} />
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-[#2B1010]">
              CloudKitchen <span className="text-[#8D0606]">OS</span>
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-[#8D0606] border border-rose-100">
              v2026 Live
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-[#5B4A45]">
          <a href="#features" className="transition hover:text-[#8D0606]">
            Features
          </a>
          <a href="#pricing" className="transition hover:text-[#8D0606]">
            Pricing Plans
          </a>
          <a href="#how-it-works" className="transition hover:text-[#8D0606]">
            How It Works
          </a>
          <a href="#faq" className="transition hover:text-[#8D0606]">
            FAQ
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/admin/login"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-300"
          >
            Admin Portal
          </Link>
          <Link
            to="/kitchen/login"
            className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-[#5B4A45] transition hover:bg-rose-50 hover:text-[#8D0606]"
          >
            Kitchen Sign In
          </Link>
          <a
            href="#pricing"
            className="flex items-center gap-1.5 rounded-xl bg-[#8D0606] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#7A0505] active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}
