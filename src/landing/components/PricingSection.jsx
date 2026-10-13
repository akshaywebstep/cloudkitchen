import React, { useState, useEffect } from "react";
import { Check, ArrowRight, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { api } from "../../api";
import { STANDARD_PLANS, getPlanPrice, getPlanStripePriceId } from "../../utils/helpers";

export function PricingSection({ onSelectPlan }) {
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [plans, setPlans] = useState(STANDARD_PLANS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.plans()
      .then((res) => {
        if (mounted && Array.isArray(res?.data) && res.data.length > 0) {
          setPlans(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch public plans:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="pricing" className="scroll-mt-16 sm:scroll-mt-20 border-t border-[#F0E6E2] bg-white py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider text-[#8D0606]">
            Transparent Subscription Plans
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2B1010]">
            Select Your Kitchen Subscription Tier
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-[#7A6762] font-normal max-w-2xl mx-auto">
            Start with a 14-day free trial on any tier. Cancel anytime with zero commitment.
          </p>

          {/* Monthly / Yearly Switcher */}
          <div className="mt-6 sm:mt-8 inline-flex max-w-full items-center rounded-xl sm:rounded-2xl border border-[#EDE2DC] bg-[#FAF8F6] p-1 sm:p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`rounded-lg sm:rounded-xl px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-[#8D0606] text-white shadow-sm"
                  : "text-[#6E5B56] hover:text-[#2B1010]"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("YEARLY")}
              className={`flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === "YEARLY"
                  ? "bg-[#8D0606] text-white shadow-sm"
                  : "text-[#6E5B56] hover:text-[#2B1010]"
              }`}
            >
              <span>Yearly</span>
              <span className="rounded-full bg-emerald-500 px-1.5 sm:px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold text-white leading-none">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid - 1 Col on mobile (<640px), 1 Col spacious on tablet (640px-1023px), 3 Cols on desktop (>=1024px) */}
        {loading && (!plans || plans.length === 0) ? (
          <div className="mt-12 flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="size-8 animate-spin text-[#8D0606]" />
            <p className="mt-3 text-xs sm:text-sm">Loading current subscription plans...</p>
          </div>
        ) : (
          <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-md sm:max-w-xl lg:max-w-none mx-auto items-stretch">
            {plans.map((plan) => {
              const isPopular = plan.isPopular;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border bg-white p-5 sm:p-6 lg:p-7 xl:p-8 transition-all hover:shadow-xl ${
                    isPopular
                      ? "border-[#8D0606] shadow-lg shadow-[#8D0606]/10 ring-2 ring-[#8D0606] lg:-translate-y-1.5"
                      : "border-[#EFE5E0] shadow-sm hover:border-[#D5C2BB]"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#8D0606] to-[#b80808] px-3.5 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                      ⭐ Most Popular Tier
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-[#2B1010]">{plan.name}</h3>
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8D0606] border border-rose-100 shrink-0">
                        {plan.badge}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-[#7A6762] min-h-[34px] sm:min-h-[36px] font-normal leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="mt-4 sm:mt-5 border-b border-[#F1E8E4] pb-4 sm:pb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2B1010]">
                          {plan.currencySymbol || "₹"}
                          {billingCycle === "YEARLY"
                            ? Number(plan.yearlyPrice || 0).toLocaleString()
                            : Number(plan.monthlyPrice || 0).toLocaleString()}
                        </span>
                        <span className="text-xs font-normal text-[#9C8D89]">
                          {billingCycle === "YEARLY" ? "/ year" : "/ month"}
                        </span>
                      </div>
                      <p className="mt-1 text-[10.5px] sm:text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                        <Sparkles size={12} className="shrink-0" />
                        <span>Includes {plan.trialDays || 14}-day free trial ({plan.currencySymbol || "₹"}0 today)</span>
                      </p>
                    </div>

                    {/* Quotas - Spacious 2 columns without truncation */}
                    <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-[#FCFBFA] p-2.5 sm:p-3.5 border border-[#F4EDE9] text-xs">
                      <div className="min-w-0">
                        <span className="block font-semibold text-[#2B1010] truncate">
                          {plan.maxBranches > 50 ? "Unlimited" : plan.maxBranches} Outlets
                        </span>
                        <span className="text-[10px] sm:text-[10.5px] text-[#9C8D89] font-normal block">
                          Branch Capacity
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block font-semibold text-[#2B1010] truncate">
                          {plan.maxUsers > 50 ? "Unlimited" : plan.maxUsers} Users
                        </span>
                        <span className="text-[10px] sm:text-[10.5px] text-[#9C8D89] font-normal block">
                          Staff Accounts
                        </span>
                      </div>
                    </div>

                    {/* Included Features - 2 cols on tablet (sm), 1 col on desktop (lg) & mobile */}
                    <div className="mt-5 sm:mt-6">
                      <p className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#8D0606] mb-2 sm:mb-2.5">
                        Included Features:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-2.5">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-[#5B4A45] font-normal">
                            <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                            <span className="leading-snug">{feat.feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Choose Plan CTA */}
                  <div className="mt-6 sm:mt-8 pt-4 border-t border-[#F1E8E4]">
                    <button
                      type="button"
                      onClick={() => onSelectPlan && onSelectPlan({ ...plan, billingCycle })}
                      className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 px-4 ${
                        isPopular
                          ? "bg-[#8D0606] text-white hover:bg-[#7A0505] shadow-md shadow-[#8D0606]/20"
                          : "border border-[#2B1010] bg-white text-[#2B1010] hover:bg-[#FAF8F6]"
                      }`}
                    >
                      <span className="truncate">Choose {plan.name}</span>
                      <ArrowRight size={14} className="shrink-0" />
                    </button>
                    <p className="mt-2 text-center text-[10px] sm:text-[10.5px] text-[#A69792] font-normal truncate px-1">
                      Stripe: <code className="font-mono text-[#8D0606] break-all">{getPlanStripePriceId(plan, billingCycle)}</code>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Security / Guarantee Footer Badge */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 text-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Enterprise-Grade Security & 256-Bit SSL Encryption</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>No credit card charges during 14-day free trial. Instant cancellation anytime.</span>
        </div>
      </div>
    </section>
  );
}
