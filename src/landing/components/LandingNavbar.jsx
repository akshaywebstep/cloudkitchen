import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChefHat,
  ArrowRight,
  Menu,
  X,
  Shield,
  LogIn,
  Sparkles,
  UtensilsCrossed,
  Workflow,
  CreditCard,
  HelpCircle,
} from "lucide-react";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile/tablet menu on route change or ESC key
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when menu is open on mobile/tablet
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    {
      label: "Features",
      href: "#features",
      desc: "POS, KDS, inventory & multi-branch",
      icon: UtensilsCrossed,
    },
    {
      label: "How It Works",
      href: "#how-it-works",
      desc: "4-step setup and instant launch",
      icon: Workflow,
    },
    {
      label: "Pricing Plans",
      href: "#pricing",
      desc: "14-day free trial on all tiers",
      icon: CreditCard,
    },
    {
      label: "FAQ",
      href: "#faq",
      desc: "Statutory FSSAI/GST & Stripe billing",
      icon: HelpCircle,
    },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#F0E6E2] bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3.5 lg:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8D0606] rounded-xl"
        >
          <div className="relative grid size-9 sm:size-10 place-items-center rounded-xl bg-gradient-to-br from-[#8D0606] to-[#b80808] text-white shadow-md shadow-rose-900/10 group-hover:scale-105 transition-transform">
            <ChefHat className="size-5 sm:size-[22px]" />
            <span className="absolute -bottom-0.5 -right-0.5 size-2 sm:size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <div className="flex items-center">
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#2B1010]">
              CloudKitchen <span className="text-[#8D0606]">OS</span>
            </span>
            <span className="hidden sm:inline-flex ml-2 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-[#8D0606] border border-rose-100">
              <Sparkles size={10} />
              v2026 Live
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (>= 1024px: lg and xl screens) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-[#5B4A45]">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[#8D0606] focus:outline-none focus-visible:text-[#8D0606] py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Actions: Desktop & Tablet */}
        <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3">
          {/* Admin link - Desktop only */}
          <Link
            to="/admin/login"
            className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-300 active:scale-95"
          >
            <Shield size={13} className="text-slate-500" />
            <span>Admin</span>
          </Link>

          {/* Kitchen Sign In - Tablet & Desktop */}
          <Link
            to="/kitchen/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#EDE2DC] bg-white px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#5B4A45] transition hover:bg-rose-50 hover:text-[#8D0606] hover:border-rose-200 active:scale-95"
          >
            <LogIn size={14} className="text-[#8D0606]" />
            <span>Kitchen Sign In</span>
          </Link>

          {/* Get Started - Mobile, Tablet, and Desktop */}
          <a
            href="#pricing"
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-[#8D0606] px-3 sm:px-3.5 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#7A0505] active:scale-95 shrink-0"
          >
            <span className="hidden xs:inline">Get Started</span>
            <span className="xs:hidden">Start</span>
            <ArrowRight size={13} />
          </a>

          {/* Hamburger Menu Toggle (Visible on Mobile & Tablet: < 1024px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="lg:hidden grid size-9 sm:size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#8D0606] transition active:scale-95 shadow-xs"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Dropdown Drawer (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#F0E6E2] bg-white/98 backdrop-blur-xl shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-5">
            {/* Nav links grid (1 col on mobile, 2 col on tablet) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 rounded-xl border border-[#F2E8E4] bg-[#FAF8F6] p-3 sm:p-3.5 hover:border-rose-200 hover:bg-rose-50/60 transition-all group"
                  >
                    <div className="grid size-8 sm:size-9 place-items-center rounded-lg bg-white border border-[#EBE0DC] text-[#8D0606] group-hover:bg-[#8D0606] group-hover:text-white transition-colors shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#2B1010] group-hover:text-[#8D0606] transition-colors">
                          {item.label}
                        </span>
                        <ArrowRight size={13} className="text-slate-400 group-hover:text-[#8D0606] transition-colors" />
                      </div>
                      <p className="text-[11px] text-[#7A6762] truncate mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Bottom Actions Row for Tablet / Mobile */}
            <div className="border-t border-[#F0E6E2] pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Link
                to="/kitchen/login"
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 flex-1 rounded-xl border border-[#EDE2DC] bg-white py-2.5 text-xs sm:text-sm font-medium text-[#2B1010] hover:bg-[#FAF8F6] transition"
              >
                <LogIn size={15} className="text-[#8D0606]" />
                <span>Kitchen Sign In</span>
              </Link>

              <Link
                to="/admin/login"
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <Shield size={15} className="text-slate-500" />
                <span>Super Admin Portal</span>
              </Link>

              <a
                href="#pricing"
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-gradient-to-r from-[#8D0606] to-[#b80808] py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-rose-900/10 hover:from-[#7A0505] hover:to-[#a10707] transition"
              >
                <span>Free Trial (₹0 Today)</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
