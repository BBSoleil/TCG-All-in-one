"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Pricing() {
  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-display text-white mb-6">
            CHOOSE YOUR <span className="text-shadow-neon text-primary">TIER</span>
          </h2>
          <p className="text-muted-foreground font-sans max-w-xl mx-auto text-lg">
            Whether you&apos;re casually tracking a few binders or managing a high-value portfolio.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -100px 0px" }}
            className="rounded-3xl glass-panel p-10 border-white/10 relative overflow-hidden"
          >
            <div className="mb-8">
              <h3 className="font-display text-3xl text-white mb-2 tracking-wider">ROOKIE</h3>
              <div className="text-4xl font-display text-white">$0 <span className="text-lg text-muted-foreground font-sans">/ forever</span></div>
            </div>

            <ul className="space-y-4 mb-10 font-sans text-muted-foreground">
              <li className="flex items-center gap-3"><Check className="text-primary" size={20} /> Track up to 2,000 cards</li>
              <li className="flex items-center gap-3"><Check className="text-primary" size={20} /> Basic market data updates (daily)</li>
              <li className="flex items-center gap-3"><Check className="text-primary" size={20} /> Deck builder (up to 10 decks)</li>
              <li className="flex items-center gap-3"><Check className="text-primary" size={20} /> Public profile & basic badges</li>
            </ul>

            <Link href="/signup">
              <Button className="w-full font-display text-xl h-14 bg-white/10 hover:bg-white/20 text-white rounded-xl">
                Start Free
              </Button>
            </Link>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -100px 0px" }}
            className="rounded-3xl p-1 holo-border relative"
          >
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full font-bold text-sm tracking-wider z-20 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
              MOST POPULAR
            </div>

            <div className="bg-card rounded-[1.4rem] p-10 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="mb-8 relative z-10">
                <h3 className="font-display text-3xl text-accent text-shadow-neon mb-2 tracking-wider">MASTER</h3>
                <div className="text-4xl font-display text-white">$9.99 <span className="text-lg text-muted-foreground font-sans">/ month</span></div>
              </div>

              <ul className="space-y-4 mb-10 font-sans text-gray-300 relative z-10">
                <li className="flex items-center gap-3"><Check className="text-accent" size={20} /> <span className="text-white font-semibold">Unlimited</span> card tracking</li>
                <li className="flex items-center gap-3"><Check className="text-accent" size={20} /> <span className="text-white font-semibold">Real-time</span> market data & charts</li>
                <li className="flex items-center gap-3"><Check className="text-accent" size={20} /> Custom price alerts (SMS/Email)</li>
                <li className="flex items-center gap-3"><Check className="text-accent" size={20} /> Unlimited deck slots & advanced synergy</li>
                <li className="flex items-center gap-3"><Check className="text-accent" size={20} /> Exclusive holographic profile badges</li>
              </ul>

              <Link href="/signup">
                <Button className="w-full font-display text-xl h-14 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl relative z-10 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                  Upgrade to Master
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
