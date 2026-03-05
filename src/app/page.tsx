import dynamic from "next/dynamic";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Footer } from "@/components/landing/footer";

const SupportedGames = dynamic(() => import("@/components/landing/supported-games").then((m) => ({ default: m.SupportedGames })));
const Features = dynamic(() => import("@/components/landing/features").then((m) => ({ default: m.Features })));
const Achievements = dynamic(() => import("@/components/landing/achievements").then((m) => ({ default: m.Achievements })));
const SocialProof = dynamic(() => import("@/components/landing/social-proof").then((m) => ({ default: m.SocialProof })));
const Pricing = dynamic(() => import("@/components/landing/pricing").then((m) => ({ default: m.Pricing })));
const CtaSection = dynamic(() => import("@/components/landing/cta-section").then((m) => ({ default: m.CtaSection })));

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
