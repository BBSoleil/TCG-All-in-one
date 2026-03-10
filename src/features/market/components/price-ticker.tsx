"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice } from "@/shared/lib/format";
import type { PriceMover } from "@/features/market/services/market-stats";

export function PriceTicker({ movers }: { movers: PriceMover[] }) {
  if (movers.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>7D PRICE MOVERS</span>
      </div>
      <div className="flex animate-scroll gap-6 px-4 py-2.5 whitespace-nowrap">
        {[...movers, ...movers].map((mover, i) => (
          <Link
            key={`${mover.cardId}-${i}`}
            href={`/cards/${mover.cardId}`}
            className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors shrink-0"
          >
            <span className="font-medium truncate max-w-32">{mover.cardName}</span>
            <span className="text-muted-foreground">{formatPrice(mover.currentPrice)}</span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                mover.changePercent >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }`}
            >
              {mover.changePercent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {mover.changePercent >= 0 ? "+" : ""}
              {mover.changePercent.toFixed(1)}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
