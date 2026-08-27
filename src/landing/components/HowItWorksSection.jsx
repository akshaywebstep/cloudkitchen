import React from "react";
import { CreditCard, LogIn, Building2, LayoutDashboard } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: CreditCard,
      title: "1. Select Plan & Stripe Trial",
      description: "Choose Starter, Growth Pro, or Enterprise. Authorize your 14-day free trial with $0 due today.",
    },
    {
      num: "02",
      icon: LogIn,
      title: "2. Account & Login Verification",
      description: "Your subscription creates your verified owner account credentials for secure role-gated access.",
    },
    {
      num: "03",
      icon: Building2,
      title: "3. Complete Kitchen Onboarding",
      description: "Provide your brand details, primary branch location, and FSSAI/GST statutory licenses.",
    },
    {
      num: "04",
      icon: LayoutDashboard,
      title: "4. Launch Operations Dashboard",
      description: "Instantly unlock your live POS order feed, recipe inventory stock, staff accounts, and menu builder.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-14 border-t border-[#F0E6E2] bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8D0606]">
            Simplified 4-Step Journey
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-normal text-[#2B1010]">
            How the Cloud Kitchen Flow Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#7A6762] font-normal">
            From subscription plan purchase to full dashboard launch in less than 3 minutes.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="relative rounded-3xl border border-[#EDE2DC] bg-[#FAF8F6] p-6 shadow-xs"
              >
                <span className="font-bold text-3xl text-rose-200/80">{st.num}</span>
                <div className="mt-3 grid size-11 place-items-center rounded-2xl bg-white border border-[#E5DDD9] text-[#8D0606] shadow-xs">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#2B1010]">{st.title}</h3>
                <p className="mt-2 text-xs text-[#7A6762] leading-relaxed font-normal">{st.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
