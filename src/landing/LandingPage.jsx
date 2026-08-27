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
    <div className="min-h-screen bg-white text-[#2B1010] font-sans antialiased selection:bg-rose-100 selection:text-[#8D0606]">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection onSelectPlan={onSelectPlan} />
      <FaqSection />
      <LandingFooter />
    </div>
  );
}
