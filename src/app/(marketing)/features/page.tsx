"use client";

import { motion } from "framer-motion";
import { Database, LineChart, Swords, Users, Bell, ShoppingCart } from "lucide-react";

const FEATURES = [
  {
    icon: Database,
    title: "Collection Tracking",
    desc: "Organize every card across Pokemon, Yu-Gi-Oh!, MTG, and One Piece. Track conditions, quantities, and see real-time set completion percentages.",
    color: "text-primary",
    border: "border-primary/30",
  },
  {
    icon: LineChart,
    title: "Market Valuation",
    desc: "Live pricing data from TCGPlayer and CardMarket. Historical charts, personal ROI tracking, and portfolio analytics at a glance.",
    color: "text-secondary",
    border: "border-secondary/30",
  },
  {
    icon: Swords,
    title: "Deck Builder",
    desc: "Construct decks with per-game format legality checks, synergy analysis, cost curve visualization, and sideboard support.",
    color: "text-accent",
    border: "border-accent/30",
  },
  {
    icon: Users,
    title: "Social Hub",
    desc: "Public profiles, achievement badges, follow other collectors, share collections, and compare progress on master sets.",
    color: "text-destructive",
    border: "border-destructive/30",
  },
  {
    icon: Bell,
    title: "Price Alerts",
    desc: "Set target prices on your wishlist cards. Get notified instantly when market prices drop to your desired level.",
    color: "text-green-400",
    border: "border-green-400/30",
  },
  {
    icon: ShoppingCart,
    title: "Marketplace",
    desc: "List cards for sale or trade, make offers, and use smart matching to find exactly what you need from other collectors.",
    color: "text-orange-400",
    border: "border-orange-400/30",
  },
];

export default function FeaturesPage() {
  return (
    <div className="pt-12 pb-20 px-6 max-w-7xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-display text-white mb-6">
          CORE <span className="text-shadow-neon text-primary">FEATURES</span>
        </h1>
        <p className="text-xl text-muted-foreground font-sans max-w-2xl mx-auto">
          Deep dive into the tools built to elevate your TCG experience.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-panel rounded-2xl p-8 border-l-4 ${feature.border}`}
          >
            <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} strokeWidth={1.5} />
            <h3 className="text-2xl font-display tracking-widest text-white mb-3">{feature.title}</h3>
            <p className="text-muted-foreground font-sans leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
