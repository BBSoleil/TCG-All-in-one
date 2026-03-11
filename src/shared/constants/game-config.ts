import type { GameType } from "@/shared/types";

export interface DeckRuleException {
  match: string;
  maxCopies: number;
}

export interface DeckRules {
  minCards: number;
  maxCards?: number;
  maxCopies: number;
  exceptions?: DeckRuleException[];
  limitedListEnabled?: boolean;
}

export interface GameConfig {
  cardRatio: string;
  playsetSize: number;
  holoRarities: string[];
  glowColor: string;
  deckRules: DeckRules;
  filters: string[];
}

export const GAME_CONFIG: Record<GameType, GameConfig> = {
  POKEMON: {
    cardRatio: "2.5 / 3.5",
    playsetSize: 4,
    holoRarities: ["RARE", "SUPER_RARE", "ULTRA_RARE", "SECRET_RARE", "SPECIAL"],
    glowColor: "shadow-yellow-500/40",
    deckRules: {
      minCards: 60,
      maxCopies: 4,
      exceptions: [
        { match: "supertype:Energy subtype:Basic", maxCopies: Infinity },
        { match: "subtypes:ACE SPEC", maxCopies: 1 },
      ],
    },
    filters: ["type", "rarity", "hp", "stage"],
  },
  YUGIOH: {
    cardRatio: "59 / 86",
    playsetSize: 3,
    holoRarities: ["SUPER_RARE", "ULTRA_RARE", "SECRET_RARE", "SPECIAL"],
    glowColor: "shadow-purple-500/40",
    deckRules: {
      minCards: 40,
      maxCards: 60,
      maxCopies: 3,
      limitedListEnabled: true,
    },
    filters: ["type", "attribute", "level", "atk", "def"],
  },
  MTG: {
    cardRatio: "63 / 88",
    playsetSize: 4,
    holoRarities: ["RARE", "SUPER_RARE", "ULTRA_RARE", "SECRET_RARE", "SPECIAL"],
    glowColor: "shadow-red-500/40",
    deckRules: {
      minCards: 60,
      maxCopies: 4,
      exceptions: [{ match: "type:Basic Land", maxCopies: Infinity }],
    },
    filters: ["color", "cmc", "type", "rarity", "format"],
  },
  ONEPIECE: {
    cardRatio: "59 / 86",
    playsetSize: 4,
    holoRarities: ["SUPER_RARE", "ULTRA_RARE", "SECRET_RARE", "SPECIAL"],
    glowColor: "shadow-blue-500/40",
    deckRules: {
      minCards: 50,
      maxCopies: 4,
    },
    filters: ["color", "cost", "type", "power", "counter"],
  },
};

/** Check if a rarity string should render holo effect */
export function isHoloRarity(gameType: GameType, rarity: string | null): boolean {
  if (!rarity) return false;
  return GAME_CONFIG[gameType].holoRarities.includes(rarity);
}

/** Get CSS aspect-ratio value for a game */
export function getCardAspectRatio(gameType: GameType): string {
  return GAME_CONFIG[gameType].cardRatio;
}

/** Get hover glow class for a game */
export function getGlowClass(gameType: GameType): string {
  return GAME_CONFIG[gameType].glowColor;
}
