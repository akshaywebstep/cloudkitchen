import React from "react";
import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#F0E6E2] bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#8D0606] text-white">
              <ChefHat size={20} />
            </div>
            <span className="text-base font-bold text-[#2B1010]">
              CloudKitchen <span className="text-[#8D0606]">OS</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#7A6762]">
            <a href="#features" className="hover:text-[#8D0606]">Features</a>
            <a href="#pricing" className="hover:text-[#8D0606]">Pricing</a>
            <a href="#how-it-works" className="hover:text-[#8D0606]">How it Works</a>
            <a href="#faq" className="hover:text-[#8D0606]">FAQ</a>
            <Link to="/login" className="hover:text-[#8D0606]">Owner Login</Link>
          </div>

          <p className="text-xs text-[#9C8D89] font-normal">
            © 2026 CloudKitchen OS Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
