import React from "react";
import { CreditCard, LogIn, Building2, LayoutDashboard, ArrowRight } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      badge: "Step 1",
      icon: CreditCard,
      title: "Select Plan & Stripe Trial",
      description: "Choose Starter, Growth Pro, or Enterprise. Authorize your 14-day free trial with $0 due today.",
    },
    {
      num: "02",
      badge: "Step 2",
      icon: LogIn,
      title: "Account & Login Verification",
      description: "Your subscription creates your verified owner account credentials for secure role-gated access.",
    },
    {
      num: "03",
      badge: "Step 3",
      icon: Building2,
      title: "Complete Kitchen Onboarding",
      description: "Provide your brand details, primary branch location, and FSSAI/GST statutory licenses.",
    },
    {
      num: "04",
      badge: "Step 4",
      icon: LayoutDashboard,
      title: "Launch Operations Dashboard",
      description: "Instantly unlock your live POS order feed, recipe inventory stock, staff accounts, and menu builder.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-16 sm:scroll-mt-20 border-t border-[#F0E6E2] bg-white py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider text-[#8D0606]">
            Simplified 4-Step Journey
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2B1010]">
            How the Cloud Kitchen Flow Works
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-[#7A6762] font-normal max-w-2xl mx-auto">
            From subscription plan purchase to full operational kitchen dashboard in less than 3 minutes.
          </p>
        </div>

        <div className="mt-8 sm:mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#EDE2DC] bg-[#FAF8F6] p-5 sm:p-6 shadow-xs transition-all hover:border-rose-200 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-2xl sm:text-3xl text-rose-300/80 font-mono">
                      {st.num}
                    </span>
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#8D0606] border border-rose-100">
                      {st.badge}
                    </span>
                  </div>

                  <div className="mt-3.5 grid size-11 place-items-center rounded-2xl bg-white border border-[#E5DDD9] text-[#8D0606] shadow-xs">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-[#2B1010] leading-snug">
                    {st.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#7A6762] leading-relaxed font-normal">
                    {st.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F0E6E2]/70 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Fast onboarding</span>
                  {idx < steps.length - 1 && (
                    <ArrowRight size={13} className="text-rose-400 hidden lg:inline" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
