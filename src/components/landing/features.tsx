"use client";

import { motion } from "framer-motion";
import { Database, LineChart, Swords, Users } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface Pillar {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  hoverBg: string;
  border: string;
  iconColor: string;
  textColor: string;
}

const PILLARS: Pillar[] = [
  {
    icon: Database,
    title: "Intelligent Collection",
    desc: "Track every card, organize by set/rarity, scan with your camera, and see real-time completion percentages.",
    color: "from-primary/10 to-transparent",
    hoverBg: "group-hover:from-primary/20",
    border: "group-hover:border-primary/60 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    iconColor: "text-primary",
    textColor: "group-hover:text-primary",
  },
  {
    icon: LineChart,
    title: "Market & Valuation",
    desc: "Live pricing data, historical charts, personal ROI tracking, and custom price alerts for your chase cards.",
    color: "from-secondary/10 to-transparent",
    hoverBg: "group-hover:from-secondary/20",
    border: "group-hover:border-secondary/60 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.3)]",
    iconColor: "text-secondary",
    textColor: "group-hover:text-secondary",
  },
  {
    icon: Swords,
    title: "Deck Builder Pro",
    desc: "Construct decks with legality checks, synergy analysis, and smart suggestions based on your existing collection.",
    color: "from-accent/10 to-transparent",
    hoverBg: "group-hover:from-accent/20",
    border: "group-hover:border-accent/60 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.3)]",
    iconColor: "text-accent",
    textColor: "group-hover:text-accent",
  },
  {
    icon: Users,
    title: "Social Hub",
    desc: "Public profiles, achievement badges, follow other collectors, and compare progress on master sets.",
    color: "from-destructive/10 to-transparent",
    hoverBg: "group-hover:from-destructive/20",
    border: "group-hover:border-destructive/60 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]",
    iconColor: "text-destructive",
    textColor: "group-hover:text-destructive",
  }
];

export function Features() {
  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display text-white mb-4">
            THE FOUR PILLARS OF A <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-holo-gradient bg-300%">
              MASTER COLLECTOR
            </span>
          </h2>
          <p className="text-muted-foreground font-sans max-w-2xl mx-auto text-lg">
            Everything you need in one centralized platform, built by collectors, for collectors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`group relative rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl overflow-hidden transition-all duration-500 cursor-pointer ${pillar.border}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${pillar.color} ${pillar.hoverBg} transition-colors duration-500`} />

              <div className="relative p-8 z-10 flex flex-col h-full">
                <div className={`w-14 h-14 rounded-xl glass-panel flex items-center justify-center mb-6 ${pillar.iconColor} transition-transform duration-500 group-hover:scale-125`}>
                  <pillar.icon strokeWidth={1.5} size={28} className="transition-transform duration-500 group-hover:scale-110" />
                </div>

                <h3 className="text-2xl font-display tracking-widest text-white mb-4">{pillar.title}</h3>
                <p className="text-muted-foreground font-sans text-sm leading-relaxed flex-grow">
                  {pillar.desc}
                </p>

                <div className={`mt-8 pt-4 border-t border-white/10 flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors ${pillar.textColor}`}>
                  <span className="group-hover:text-current transition-colors">Explore Module</span> <span className="ml-2 group-hover:translate-x-1 transition-transform group-hover:text-current">&rarr;</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
