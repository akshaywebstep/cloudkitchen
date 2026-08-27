import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "Is a subscription required before I can log in and onboard my kitchen?",
      a: "Yes. In our SaaS workflow, kitchen owners choose an active tier (Starter, Growth Pro, or Enterprise) first to create their verified account. After authorizing the 14-day free trial, you complete the Kitchen Onboarding (FSSAI, GST, address) to launch your live Operations Dashboard.",
    },
    {
      q: "Will I be charged today during the 14-day free trial?",
      a: "No. $0.00 is charged today. A standard card authorization is placed via Stripe to secure your account. Your first billing cycle will only begin after the 14-day free trial concludes, and you can cancel anytime before that.",
    },
    {
      q: "Can I upgrade or downgrade my plan as I open more kitchen outlets?",
      a: "Absolutely. You can seamlessly switch between Starter (1 branch), Growth Pro (up to 5 branches), and Enterprise (unlimited branches) right from the Subscription Manager badge in your dashboard Topbar.",
    },
    {
      q: "What documents are required during Kitchen Onboarding?",
      a: "You will need your kitchen brand name, primary outlet street address, 14-digit FSSAI Food License number, and 15-character GSTIN certificate for tax invoicing.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-14 border-t border-[#F0E6E2] bg-[#FAF8F6] py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8D0606]">
            Frequently Asked Questions
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-normal text-[#2B1010]">
            Got Questions? We Have Answers.
          </h2>
        </div>

        <div className="mt-10 space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-[#EDE2DC] bg-white transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-[#2B1010]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[#8D0606] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#7A6762] leading-relaxed border-t border-slate-100 pt-3 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
