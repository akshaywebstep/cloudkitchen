import React from "react";
import { Link } from "react-router-dom";
import { ChefHat, ArrowUp, ShieldCheck } from "lucide-react";

export function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[#F0E6E2] bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Brand & Badge */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 sm:size-10 place-items-center rounded-xl bg-[#8D0606] text-white shadow-sm">
                <ChefHat className="size-5" />
              </div>
              <span className="text-base sm:text-lg font-bold text-[#2B1010]">
                CloudKitchen <span className="text-[#8D0606]">OS</span>
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">All Systems Operational</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-medium text-[#7A6762]">
            <a href="#features" className="hover:text-[#8D0606] transition-colors py-1">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#8D0606] transition-colors py-1">
              How it Works
            </a>
            <a href="#pricing" className="hover:text-[#8D0606] transition-colors py-1">
              Pricing Plans
            </a>
            <a href="#faq" className="hover:text-[#8D0606] transition-colors py-1">
              FAQ
            </a>
            <Link to="/kitchen/login" className="hover:text-[#8D0606] transition-colors py-1">
              Kitchen Sign In
            </Link>
            <Link to="/admin/login" className="hover:text-[#8D0606] transition-colors py-1">
              Super Admin
            </Link>
          </div>

          {/* Back to top & Copyright */}
          <div className="flex items-center gap-4 text-xs text-[#9C8D89]">
            <p className="text-center sm:text-right">
              © {new Date().getFullYear()} CloudKitchen OS Inc.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="grid size-8 place-items-center rounded-lg border border-[#EDE2DC] bg-[#FAF8F6] text-[#7A6762] hover:text-[#8D0606] hover:bg-rose-50 transition active:scale-95 shrink-0"
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
