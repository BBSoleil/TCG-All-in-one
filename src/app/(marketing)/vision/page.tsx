"use client";

import { motion } from "framer-motion";

export default function VisionPage() {
  return (
    <div className="pt-12 pb-20 px-6 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-display text-white mb-6">
          OUR <span className="text-shadow-neon text-secondary">VISION</span>
        </h1>
      </motion.div>

      <div className="prose prose-invert prose-lg font-sans text-muted-foreground space-y-6">
        <p>
          The story behind TCG All-in-One is born from a simple frustration: managing a growing collection across spreadsheets, multiple price guides, and disorganized binders.
        </p>
        <p>
          We are building the ultimate digital hub for serious TCG collectors. A place where the tactile joy of physical cards meets the analytical power of modern software.
        </p>
        <p>
          Our platform supports Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and One Piece Card Game &mdash; with more universes on the horizon. Whether you collect casually or manage a high-value portfolio, TCG All-in-One gives you the tools to track, value, build decks, and connect with a global community of collectors.
        </p>
      </div>
    </div>
  );
}
