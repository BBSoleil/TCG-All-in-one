"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url(/images/dark-bg.png)` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      <div className="absolute inset-0 z-0 bg-grid-white/[0.02]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 w-fit backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">The Ultimate Collector&apos;s Vault</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-display leading-[0.9] text-white">
            MASTER YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-holo-gradient bg-300%">
              TCG UNIVERSE
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground font-sans max-w-xl leading-relaxed">
            Turn your TCG collection into an intelligent portfolio, a social asset, and a competitive ecosystem.
            Track, value, build, and connect.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group px-8 py-4 bg-primary rounded-lg font-display text-2xl tracking-widest text-white overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.4)]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                Start Your Collection
              </motion.button>
            </Link>

            <Link href="/features">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-lg font-display text-2xl tracking-widest text-white border border-white/20 glass-panel hover:bg-white/10 transition-colors"
              >
                Explore Features
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[600px] flex items-center justify-center"
          style={{ perspective: 1000 }}
        >
          {/* Floating effects behind card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

          <motion.div
            animate={{
              y: [-15, 15, -15],
              rotateY: [-8, 8, -8],
              rotateX: [8, -8, 8]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10 w-full max-w-[400px]"
          >
            {/* Soft moving shadow below the card */}
            <motion.div
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-primary/40 blur-[30px] rounded-full pointer-events-none"
            />
            <Image
              src="/images/hero-card.png"
              alt="Holographic TCG Card"
              width={400}
              height={560}
              className="w-full h-auto drop-shadow-[0_0_50px_rgba(56,189,248,0.5)]"
              priority
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs font-display tracking-widest text-white/50 uppercase">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
