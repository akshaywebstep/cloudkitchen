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
      title: "Real-time POS & Kitchen Display System",
      description:
        "Manage incoming order feeds from Swiggy, Zomato, and POS counters in real-time with prep status stages.",
    },
    {
      icon: Layers,
      title: "Multi-Outlet & Multi-Brand Branching",
      description:
        "Expand from 1 outlet to 50+ dark stores with individualized inventory quotas, staff roles, and menus.",
    },
    {
      icon: TrendingDown,
      title: "Recipe Stock Yield & Waste Prevention",
      description:
        "Automatically track ingredient deduction per order and identify waste hotspots before food spoils.",
    },
    {
      icon: Users,
      title: "Role-Based Staff Access (RBAC)",
      description:
        "Granular access control for Head Chefs, Cashiers, Shift Managers, and Franchise Owners.",
    },
    {
      icon: ShieldCheck,
      title: "FSSAI & GST Compliance Verification",
      description:
        "Built-in compliance checks for statutory food license verification and GST invoicing records.",
    },
    {
      icon: Zap,
      title: "Instant Stripe Subscription Activation",
      description:
        "Automated checkout session, 14-day free trial authorization, and instant provisioning via webhooks.",
    },
  ];

  return (
    <section id="features" className="scroll-mt-14 border-t border-[#F0E6E2] bg-[#FAF8F6] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8D0606]">
            Built for High-Growth Cloud Kitchens
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-normal text-[#2B1010]">
            Everything Needed to Run a Profitable Food Brand
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#7A6762] font-normal">
            Engineered specifically to solve inventory leakage, prep bottlenecks, and multi-branch confusion.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="rounded-3xl border border-[#EDE2DC] bg-white p-6 sm:p-7 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-rose-50 border border-rose-100 text-[#8D0606]">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#2B1010]">{feat.title}</h3>
                <p className="mt-2 text-xs sm:text-sm text-[#7A6762] leading-relaxed font-normal">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
