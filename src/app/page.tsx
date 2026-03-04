"use client";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { SupportedGames } from "@/components/landing/supported-games";
import { Features } from "@/components/landing/features";
import { Achievements } from "@/components/landing/achievements";
import { SocialProof } from "@/components/landing/social-proof";
import { Pricing } from "@/components/landing/pricing";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <Hero />
      <SupportedGames />
      <Features />
      <Achievements />
      <SocialProof />
      <Pricing />
      <CtaSection />
      <Footer />
    </div>
  );
}
