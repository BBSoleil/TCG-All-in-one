import type { GameType } from "@/shared/types";

export interface PriceSource {
  label: string;
  url: string;
}

/**
 * Which external data source we pull prices from, per game.
 * Kept in one place so the card detail UI, analytics, and docs stay in sync.
 * See src/features/cards/services/price-sync.ts for the fetch logic.
 */
export const PRICE_SOURCES: Record<GameType, PriceSource> = {
  POKEMON: {
    label: "CardMarket via pokemontcg.io",
    url: "https://www.cardmarket.com",
  },
  YUGIOH: {
    label: "TCGplayer via YGOProDeck",
    url: "https://www.tcgplayer.com",
  },
  MTG: {
    label: "Scryfall",
    url: "https://scryfall.com",
  },
  ONEPIECE: {
    label: "OPTCG API",
    url: "https://optcgapi.com",
  },
};

export function getPriceSource(gameType: string): PriceSource | null {
  return PRICE_SOURCES[gameType as GameType] ?? null;
}

/**
 * Human-friendly "last updated N ago" string. Caps at "today" if under an hour
 * because the sync cadence is daily and sub-hour precision is misleading.
 */
export function formatLastUpdated(updatedAt: Date | string | null): string | null {
  if (!updatedAt) return null;
  const date = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays < 14 ? "" : "s"} ago`;
  return `${Math.floor(diffDays / 30)} month${diffDays < 60 ? "" : "s"} ago`;
}
