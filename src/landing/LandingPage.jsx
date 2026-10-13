import React from "react";
import { LandingNavbar } from "./components/LandingNavbar";
import { HeroSection } from "./components/HeroSection";
import { PricingSection } from "./components/PricingSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { FaqSection } from "./components/FaqSection";
import { LandingFooter } from "./components/LandingFooter";

export function LandingPage({ onSelectPlan }) {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#2B1010] font-sans antialiased selection:bg-rose-100 selection:text-[#8D0606] scroll-smooth flex flex-col">
      <LandingNavbar />
      <main id="main-content" className="flex-1 w-full max-w-full">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection onSelectPlan={onSelectPlan} />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
