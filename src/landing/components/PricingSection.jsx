import React, { useState, useEffect } from "react";
import { Check, ArrowRight, Sparkles, CalendarDays, Repeat, Loader2 } from "lucide-react";
import { api } from "../../api";
import { STANDARD_PLANS, getPlanPrice, getPlanStripePriceId } from "../../utils/helpers";

export function PricingSection({ onSelectPlan }) {
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [plans, setPlans] = useState(STANDARD_PLANS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Fires public GET https://dev2.screeningstar.co.in/api/v1/kitchen/subscription/plans
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
    <section id="pricing" className="scroll-mt-14 border-t border-[#F0E6E2] bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8D0606]">
            Transparent Subscription Plans
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-normal text-[#2B1010]">
            Select Your Kitchen Subscription Tier
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#7A6762] font-normal">
            Start with a 7-day free trial on any tier. Cancel anytime with no questions asked.
          </p>

          {/* Monthly / Yearly Switcher */}
          <div className="mt-8 inline-flex items-center rounded-2xl border border-[#EDE2DC] bg-[#FAF8F6] p-1.5 shadow-xs">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                billingCycle === "YEARLY"
                  ? "bg-[#8D0606] text-white shadow-sm"
                  : "text-[#6E5B56] hover:text-[#2B1010]"
              }`}
            >
              <span>Yearly Billing</span>
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const isPopular = plan.isPopular;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border bg-white p-6 sm:p-8 transition-all hover:shadow-xl ${
                  isPopular
                    ? "border-[#8D0606] shadow-lg shadow-[#8D0606]/10 ring-2 ring-[#8D0606]"
                    : "border-[#EFE5E0] shadow-sm hover:border-[#D5C2BB]"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#8D0606] to-[#b80808] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    ⭐ Most Popular Tier
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#2B1010]">{plan.name}</h3>
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8D0606] border border-rose-100">
                      {plan.badge}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-[#7A6762] min-h-[36px] font-normal">{plan.description}</p>

                  <div className="mt-5 border-b border-[#F1E8E4] pb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-bold text-[#2B1010]">
                        {plan.currencySymbol || "₹"}
                        {billingCycle === "YEARLY"
                          ? Number(plan.yearlyPrice || 0).toLocaleString()
                          : Number(plan.monthlyPrice || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-normal text-[#9C8D89]">
                        {billingCycle === "YEARLY" ? "/ year" : "/ month"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                      <Sparkles size={12} />
                      Includes {plan.trialDays || 7}-day free trial ({plan.currencySymbol || "₹"}0 today)
                    </p>
                  </div>

                  {/* Quotas */}
                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#FCFBFA] p-3 border border-[#F4EDE9] text-xs">
                    <div>
                      <span className="block font-semibold text-[#2B1010]">
                        {plan.maxBranches > 50 ? "Unlimited" : plan.maxBranches} Outlets
                      </span>
                      <span className="text-[10.5px] text-[#9C8D89] font-normal">Branch Capacity</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-[#2B1010]">
                        {plan.maxUsers > 50 ? "Unlimited" : plan.maxUsers} Users
                      </span>
                      <span className="text-[10.5px] text-[#9C8D89] font-normal">Staff Accounts</span>
                    </div>
                  </div>

                  {/* Included Features */}
                  <div className="mt-6 space-y-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#8D0606]">
                      Included Features:
                    </p>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#5B4A45] font-normal">
                        <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span>{feat.feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Choose Plan CTA */}
                <div className="mt-8 pt-4 border-t border-[#F1E8E4]">
                  <button
                    type="button"
                    onClick={() => onSelectPlan({ ...plan, billingCycle })}
                    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 ${
                      isPopular
                        ? "bg-[#8D0606] text-white hover:bg-[#7A0505] shadow-md shadow-[#8D0606]/20"
                        : "border border-[#2B1010] bg-white text-[#2B1010] hover:bg-[#FAF8F6]"
                    }`}
                  >
                    <span>Choose {plan.name}</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="mt-2 text-center text-[10.5px] text-[#A69792] font-normal">
                    Stripe Price ID: <code className="font-mono text-[#8D0606]">{getPlanStripePriceId(plan, billingCycle)}</code>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
