"use client";

import { motion } from "framer-motion";
import { Database, Users, Globe, CheckCircle2, type LucideIcon } from "lucide-react";
import Image from "next/image";

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

const TESTIMONIALS = [
  {
    quote: "Finally, one app for my entire Pokemon collection. The price tracking alone is worth it.",
    user: "@VaultMaster_JP",
    badge: "Legendary Collector",
    avatar: "/images/avatar-1.png",
  },
  {
    quote: "I switched from 3 different apps. TCG All-in-One replaced all of them.",
    user: "@BluEyesDragon",
    badge: "Master Trader",
    avatar: "/images/avatar-2.png",
  },
  {
    quote: "The deck builder suggestions from my own collection? Game changer.",
    user: "@MTG_Sarah",
    badge: "Deck Architect",
    avatar: "/images/avatar-3.png",
  }
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
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border-white/10"
            >
              <stat.icon className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <div className="text-3xl md:text-4xl font-display text-white mb-2">{stat.value}</div>
              <div className="text-sm font-sans text-muted-foreground uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative p-1 rounded-2xl group"
            >
              {/* Subtle Holo Border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors duration-500" />

              <div className="relative bg-card/80 backdrop-blur-md h-full rounded-[15px] p-8 border border-white/5 border-l-4 border-l-primary/30 group-hover:border-l-primary flex flex-col justify-between transition-colors">
                <p className="text-muted-foreground font-sans text-lg italic mb-8 relative z-10">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                    <Image src={testimonial.avatar} alt={testimonial.user} width={48} height={48} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-display text-white tracking-wider text-lg">{testimonial.user}</div>
                    <div className="text-xs font-sans text-primary">{testimonial.badge}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
