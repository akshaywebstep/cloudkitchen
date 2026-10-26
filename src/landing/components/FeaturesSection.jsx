import React from "react";
import {
  UtensilsCrossed,
  Layers,
  TrendingDown,
  Users,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: UtensilsCrossed,
      badge: "Real-time POS",
      title: "POS & Kitchen Display System (KDS)",
      description:
        "Manage incoming order feeds from Swiggy, Zomato, and direct walk-in counters in real-time with granular prep stages.",
    },
    {
      icon: Layers,
      badge: "Dark Store Scale",
      title: "Multi-Outlet & Multi-Brand Branching",
      description:
        "Expand from 1 outlet to 50+ dark stores with individualized inventory quotas, branch staff roles, and independent menus.",
    },
    {
      icon: TrendingDown,
      badge: "Yield Matrix",
      title: "Recipe Stock Yield & Waste Prevention",
      description:
        "Automatically track ingredient deduction per order and identify waste hotspots before perishable food spoils.",
    },
    {
      icon: Users,
      badge: "Security & RBAC",
      title: "Role-Based Staff Access Controls",
      description:
        "Granular access controls for Head Chefs, Cashiers, Shift Managers, Store Inventory Managers, and Franchise Owners.",
    },
    {
      icon: ShieldCheck,
      badge: "Statutory Ready",
      title: "FSSAI & GST Compliance Verification",
      description:
        "Built-in compliance checks for statutory food license verification, branch FSSAI renewals, and GST invoicing records.",
    },
    {
      icon: Zap,
      badge: "Zero Downtime",
      title: "Instant Stripe Subscription Activation",
      description:
        "Automated checkout session, 14-day free trial authorization, and instant dashboard provisioning via live webhooks.",
    },
  ];

  return (
    <section id="features" className="scroll-mt-16 sm:scroll-mt-20 border-t border-[#F0E6E2] bg-[#FAF8F6] py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider text-[#8D0606]">
            Built for High-Growth Cloud Kitchens
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2B1010]">
            Everything Needed to Run a Profitable Food Brand
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-[#7A6762] font-normal max-w-2xl mx-auto">
            Engineered specifically to solve inventory leakage, prep bottlenecks, and multi-branch franchise confusion.
          </p>
        </div>

        <div className="mt-8 sm:mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#EDE2DC] bg-white p-5 sm:p-6 lg:p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-rose-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="grid size-11 sm:size-12 place-items-center rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-100 text-[#8D0606] group-hover:bg-[#8D0606] group-hover:text-white transition-colors duration-300">
                      <Icon className="size-5 sm:size-6" />
                    </div>
                    <span className="rounded-full bg-slate-50 border border-slate-200/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base sm:text-lg font-semibold text-[#2B1010] leading-snug">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#7A6762] leading-relaxed font-normal">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#8D0606] font-medium">
                  <span>Included on all plans</span>
                  <span className="text-slate-400 group-hover:text-[#8D0606] transition-colors">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
