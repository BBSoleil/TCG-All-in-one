"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface Game {
  name: string;
  color: string;
  glow: string;
  borderColor: string;
  stats: string;
  font: string;
  symbol: ReactNode;
}

const GAMES: Game[] = [
  {
    name: "Pokemon TCG",
    color: "from-yellow-400/80 to-red-500/80",
    glow: "group-hover:shadow-[0_0_40px_rgba(250,204,21,0.4)]",
    borderColor: "group-hover:border-yellow-400/50",
    stats: "15,200+ cards tracked",
    font: "font-display tracking-wider",
    symbol: (
      <div className="w-24 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-white/30 stroke-[6] group-hover:stroke-white/90 transition-colors drop-shadow-md">
          <circle cx="50" cy="50" r="40" />
          <line x1="10" y1="50" x2="35" y2="50" />
          <line x1="65" y1="50" x2="90" y2="50" />
          <circle cx="50" cy="50" r="15" />
          <circle cx="50" cy="50" r="6" fill="currentColor" className="fill-transparent group-hover:fill-white/90 transition-colors" />
        </svg>
      </div>
    )
  },
  {
    name: "Yu-Gi-Oh!",
    color: "from-orange-500/80 to-yellow-600/80",
    glow: "group-hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]",
    borderColor: "group-hover:border-orange-500/50",
    stats: "12,400+ cards tracked",
    font: "font-display italic tracking-widest",
    symbol: (
      <div className="w-24 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-white/30 stroke-[6] group-hover:stroke-white/90 transition-colors drop-shadow-md" strokeLinejoin="round">
          <polygon points="50,15 90,85 10,85" />
          <path d="M 30 85 L 50 50 L 70 85" />
          <path d="M 10 30 L 90 30" />
          <circle cx="50" cy="55" r="8" />
          <circle cx="50" cy="55" r="2" fill="currentColor" className="fill-white/30 group-hover:fill-white/90 transition-colors" />
        </svg>
      </div>
    )
  },
  {
    name: "Magic: The Gathering",
    color: "from-blue-600/80 to-indigo-900/80",
    glow: "group-hover:shadow-[0_0_40px_rgba(37,99,235,0.4)]",
    borderColor: "group-hover:border-blue-500/50",
    stats: "25,000+ cards tracked",
    font: "font-serif font-bold tracking-wide",
    symbol: (
      <div className="w-24 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-white/30 stroke-[5] group-hover:stroke-white/90 transition-colors drop-shadow-md" strokeLinejoin="round">
          <polygon points="50,10 61,39 92,39 67,58 76,88 50,70 24,88 33,58 8,39 39,39" />
          <circle cx="50" cy="53" r="8" fill="currentColor" className="fill-transparent group-hover:fill-white/90 transition-colors" />
        </svg>
      </div>
    )
  },
  {
    name: "One Piece",
    color: "from-red-600/80 to-orange-500/80",
    glow: "group-hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]",
    borderColor: "group-hover:border-red-500/50",
    stats: "4,800+ cards tracked",
    font: "font-display text-4xl tracking-widest",
    symbol: (
      <div className="w-24 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-white/30 stroke-[6] group-hover:stroke-white/90 transition-colors drop-shadow-md" strokeLinecap="round" strokeLinejoin="round">
          <line x1="15" y1="15" x2="85" y2="85" />
          <line x1="15" y1="85" x2="85" y2="15" />
          <path d="M 30 45 A 20 20 0 1 1 70 45 L 70 55 A 10 10 0 0 1 60 65 L 40 65 A 10 10 0 0 1 30 55 Z" className="fill-black/50" />
          <circle cx="42" cy="40" r="4" fill="currentColor" className="fill-white/30 group-hover:fill-white/90 transition-colors" />
          <circle cx="58" cy="40" r="4" fill="currentColor" className="fill-white/30 group-hover:fill-white/90 transition-colors" />
          <line x1="45" y1="58" x2="45" y2="65" />
          <line x1="50" y1="58" x2="50" y2="65" />
          <line x1="55" y1="58" x2="55" y2="65" />
        </svg>
      </div>
    )
  }
];

export function SupportedGames() {
  return (
    <section className="py-24 relative overflow-hidden bg-black/40 backdrop-blur-sm z-10">
      {/* Animated particle background */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              top: `${(i * 37 + 13) % 100}%`,
              left: `${(i * 53 + 7) % 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: (i % 5) * 0.4
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display text-white mb-4">
            FOUR UNIVERSES. <span className="text-shadow-neon text-primary">ONE VAULT.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`group relative h-80 rounded-2xl border border-white/10 bg-card overflow-hidden transition-all duration-500 cursor-pointer ${game.glow} ${game.borderColor}`}
            >
              {/* Dynamic Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10 group-hover:opacity-30 transition-opacity duration-500`} />

              <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center z-10">
                {/* Abstract Symbol */}
                <div className="mb-8 transform group-hover:scale-110 transition-transform duration-500">
                  {game.symbol}
                </div>

                {/* Game Name & Stats */}
                <h3 className={`text-2xl md:text-3xl text-white mb-3 ${game.font} drop-shadow-md`}>
                  {game.name}
                </h3>
                <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                  <span className="text-sm font-sans text-white/80 font-medium">
                    {game.stats}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
