"use client";

import { motion } from "framer-motion";
import { Award, Flame, Crown, Diamond, Zap, Star, type LucideIcon } from "lucide-react";

interface Badge {
  id: number;
  name: string;
  rarity: string;
  icon: LucideIcon;
  color: string;
  ring: string;
  bgGlow: string;
  tagBorder: string;
  isHolo: boolean;
}

const BADGES: Badge[] = [
  { id: 1, name: "VAULT FOUNDER", rarity: "MYTHIC", icon: Crown, color: "text-yellow-400", ring: "border-yellow-400", bgGlow: "group-hover:shadow-[0_0_30px_rgba(250,204,21,0.5)]", tagBorder: "border-yellow-400", isHolo: true },
  { id: 2, name: "MASTER TRADER", rarity: "LEGENDARY", icon: Diamond, color: "text-purple-400", ring: "border-purple-400", bgGlow: "group-hover:shadow-[0_0_30px_rgba(192,132,252,0.5)]", tagBorder: "border-purple-400", isHolo: true },
  { id: 3, name: "SET KING", rarity: "EPIC", icon: Award, color: "text-blue-400", ring: "border-blue-400", bgGlow: "group-hover:shadow-[0_0_30px_rgba(96,165,250,0.5)]", tagBorder: "border-blue-400", isHolo: false },
  { id: 4, name: "WHALE STATUS", rarity: "EPIC", icon: Star, color: "text-pink-400", ring: "border-pink-400", bgGlow: "group-hover:shadow-[0_0_30px_rgba(244,114,182,0.5)]", tagBorder: "border-pink-400", isHolo: false },
  { id: 5, name: "DECK ARCHITECT", rarity: "RARE", icon: Zap, color: "text-green-400", ring: "border-green-400", bgGlow: "group-hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]", tagBorder: "border-green-400", isHolo: false },
  { id: 6, name: "COMMUNITY LEGEND", rarity: "RARE", icon: Flame, color: "text-orange-400", ring: "border-orange-400", bgGlow: "group-hover:shadow-[0_0_30px_rgba(251,146,60,0.5)]", tagBorder: "border-orange-400", isHolo: false },
];

export function Achievements() {
  return (
    <section className="pt-10 pb-8 relative bg-background z-20">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display text-white mb-2">
            EARN YOUR <span className="text-shadow-neon text-accent">STATUS</span>
          </h2>
          <p className="text-muted-foreground font-sans text-lg">
            14 unique badges to unlock. Let your profile tell your story.
          </p>
        </div>

        <div className="relative w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 justify-items-center" style={{ perspective: 1000 }}>
          {BADGES.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ rotateY: 15, rotateX: 10, scale: 1.05, y: -5 }}
              className="flex flex-col items-center group cursor-pointer w-full max-w-[140px]"
            >
              <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 ${badge.ring} bg-card/80 backdrop-blur-sm flex items-center justify-center mb-4 transition-shadow duration-300 shadow-lg ${badge.bgGlow}`}>
                {badge.isHolo && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_infinite] overflow-hidden">
                    <div className="w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
                  </div>
                )}
                <badge.icon className={`w-10 h-10 md:w-12 md:h-12 ${badge.color} relative z-10`} strokeWidth={1.5} />
              </div>

              <div className="text-center">
                <h4 className="font-display text-lg md:text-xl text-white tracking-widest mb-1 group-hover:text-shadow-neon transition-all leading-tight">
                  {badge.name}
                </h4>
                <div className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full border bg-black/40 backdrop-blur-md inline-block ${badge.tagBorder} ${badge.color}`}>
                  {badge.rarity}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
