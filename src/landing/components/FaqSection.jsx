import React, { useState } from "react";
import { ChevronDown, HelpCircle, MessageSquare } from "lucide-react";

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "Is a subscription required before I can log in and onboard my kitchen?",
      a: "Yes. In our SaaS workflow, kitchen owners choose an active tier (Starter, Growth Pro, or Enterprise) first to create their verified account. After authorizing the 14-day free trial, you complete the Kitchen Onboarding (FSSAI, GST, address) to launch your live Operations Dashboard.",
    },
    {
      q: "Will I be charged today during the 14-day free trial?",
      a: "No. $0.00 is charged today. A standard card authorization is placed via Stripe to secure your account. Your first billing cycle will only begin after the 14-day free trial concludes, and you can cancel anytime before that with no penalty.",
    },
    {
      q: "Can I upgrade or downgrade my plan as I open more kitchen outlets?",
      a: "Absolutely. You can seamlessly switch between Starter (1 branch), Growth Pro (up to 5 branches), and Enterprise (unlimited branches) right from the Subscription Manager badge in your dashboard Topbar.",
    },
    {
      q: "What documents are required during Kitchen Onboarding?",
      a: "You will need your kitchen brand name, primary outlet street address, 14-digit FSSAI Food License number, and 15-character GSTIN certificate for tax invoicing.",
    },
    {
      q: "Can my kitchen staff access the POS without seeing owner financials?",
      a: "Yes. The platform provides strict Role-Based Access Controls (RBAC). Cashiers and Head Chefs only see order preparation queues and stock levels, while revenue reports and billing remain strictly visible to Franchise Owners.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-16 sm:scroll-mt-20 border-t border-[#F0E6E2] bg-[#FAF8F6] py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-3.5 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider text-[#8D0606]">
            Frequently Asked Questions
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2B1010]">
            Got Questions? We Have Answers.
          </h2>
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-[#7A6762] font-normal max-w-xl mx-auto">
            Everything you need to know about starting your 14-day free trial and setting up your kitchen.
          </p>
        </div>

        <div className="mt-8 sm:mt-12 space-y-3 sm:space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl sm:rounded-2xl border border-[#EDE2DC] bg-white transition shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm md:text-base font-semibold text-[#2B1010] gap-3"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <div className={`grid size-7 sm:size-8 shrink-0 place-items-center rounded-lg bg-rose-50 text-[#8D0606] transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-rose-100" : ""
                  }`}>
                    <ChevronDown size={16} />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-[#7A6762] leading-relaxed border-t border-slate-100 pt-3 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Help Banner */}
        <div className="mt-8 sm:mt-12 rounded-2xl border border-[#EDE2DC] bg-white p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-rose-50 text-[#8D0606] shrink-0">
              <HelpCircle size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#2B1010]">Need additional onboarding support?</p>
              <p className="text-[11px] sm:text-xs text-[#7A6762]">Our cloud kitchen technical specialists are ready to help you configure your outlets.</p>
            </div>
          </div>
          <a
            href="mailto:support@cloudkitchen.live"
            className="flex items-center gap-1.5 rounded-xl border border-[#EDE2DC] bg-[#FAF8F6] px-4 py-2 text-xs font-semibold text-[#2B1010] hover:bg-rose-50 hover:text-[#8D0606] transition shrink-0"
          >
            <MessageSquare size={14} />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </section>
  );
}
