"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <h2 className="text-5xl md:text-7xl font-display text-white mb-6">
            YOUR COLLECTION IS <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-holo-gradient bg-300%">WAITING</span>
          </h2>
          <p className="text-xl text-muted-foreground font-sans mb-10 max-w-2xl">
            Join thousands of collectors who have already upgraded their experience. Start tracking your portfolio today.
          </p>

          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative group px-10 py-5 bg-white text-black rounded-xl font-display text-2xl tracking-widest overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_rgba(255,255,255,0.5)] transition-shadow duration-300"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              OPEN YOUR VAULT
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
