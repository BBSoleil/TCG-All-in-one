"use client";

import { motion } from "framer-motion";
import { Database, Users, Globe, CheckCircle2, Layers, LineChart, Sparkles, type LucideIcon } from "lucide-react";

interface Stat {
  icon: LucideIcon;
  label: string;
  value: string;
}

const STATS: Stat[] = [
  { icon: Database, label: "Cards Tracked", value: "90,000+" },
  { icon: Users, label: "Supported Games", value: "4" },
  { icon: Globe, label: "Card Sets", value: "500+" },
  { icon: CheckCircle2, label: "Free to Start", value: "$0" },
];

interface Highlight {
  icon: LucideIcon;
  title: string;
  body: string;
}

const HIGHLIGHTS: Highlight[] = [
  {
    icon: Layers,
    title: "One vault, every TCG",
    body: "Pokemon, Yu-Gi-Oh!, Magic, and One Piece in a single collection — no app switching, no spreadsheets.",
  },
  {
    icon: LineChart,
    title: "Real-time valuation",
    body: "Your portfolio value updates as markets move. Track gainers, losers, and total worth across every card you own.",
  },
  {
    icon: Sparkles,
    title: "Built for the long run",
    body: "Deck builder, marketplace, wishlists, alerts. New features ship weekly. You shape the roadmap.",
  },
];

export function SocialProof() {
  return (
    <section className="pb-24 relative bg-black/20 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 relative z-10">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1, margin: "0px 0px -100px 0px" }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border-white/10"
            >
              <stat.icon className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <div className="text-3xl md:text-4xl font-display text-white mb-2">{stat.value}</div>
              <div className="text-sm font-sans text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Why builders pick TCG All-in-One */}
        <div className="grid md:grid-cols-3 gap-6">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.1, margin: "0px 0px -100px 0px" }}
              transition={{ delay: i * 0.15 }}
              className="relative p-1 rounded-2xl group"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors duration-500" />

              <div className="relative bg-card/80 backdrop-blur-md h-full rounded-[15px] p-8 border border-white/5 border-l-4 border-l-primary/30 group-hover:border-l-primary flex flex-col gap-4 transition-colors">
                <h.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                <h3 className="font-display text-white tracking-wider text-xl">{h.title}</h3>
                <p className="text-muted-foreground font-sans text-base leading-relaxed">
                  {h.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
