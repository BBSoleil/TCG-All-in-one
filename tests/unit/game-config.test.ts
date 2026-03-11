import { describe, it, expect } from "vitest";
import {
  GAME_CONFIG,
  isHoloRarity,
  getCardAspectRatio,
  getGlowClass,
} from "@/shared/constants/game-config";

const ALL_GAMES = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"] as const;

describe("GAME_CONFIG", () => {
  it("has config for all 4 games", () => {
    for (const game of ALL_GAMES) {
      expect(GAME_CONFIG[game]).toBeDefined();
    }
  });

  it("each game has a valid cardRatio string", () => {
    for (const game of ALL_GAMES) {
      const ratio = GAME_CONFIG[game].cardRatio;
      expect(ratio).toMatch(/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/);
    }
  });

  it("each game has playsetSize >= 1", () => {
    for (const game of ALL_GAMES) {
      expect(GAME_CONFIG[game].playsetSize).toBeGreaterThanOrEqual(1);
    }
  });

  it("Pokemon playset is 4, YGO playset is 3", () => {
    expect(GAME_CONFIG.POKEMON.playsetSize).toBe(4);
    expect(GAME_CONFIG.YUGIOH.playsetSize).toBe(3);
    expect(GAME_CONFIG.MTG.playsetSize).toBe(4);
    expect(GAME_CONFIG.ONEPIECE.playsetSize).toBe(4);
  });

  it("each game has at least one holo rarity", () => {
    for (const game of ALL_GAMES) {
      expect(GAME_CONFIG[game].holoRarities.length).toBeGreaterThan(0);
    }
  });

  it("each game has a glowColor", () => {
    for (const game of ALL_GAMES) {
      expect(GAME_CONFIG[game].glowColor).toBeTruthy();
    }
  });

  it("deck rules have valid minCards", () => {
    expect(GAME_CONFIG.POKEMON.deckRules.minCards).toBe(60);
    expect(GAME_CONFIG.YUGIOH.deckRules.minCards).toBe(40);
    expect(GAME_CONFIG.MTG.deckRules.minCards).toBe(60);
    expect(GAME_CONFIG.ONEPIECE.deckRules.minCards).toBe(50);
  });

  it("YGO has limitedListEnabled", () => {
    expect(GAME_CONFIG.YUGIOH.deckRules.limitedListEnabled).toBe(true);
  });

  it("each game has at least one filter", () => {
    for (const game of ALL_GAMES) {
      expect(GAME_CONFIG[game].filters.length).toBeGreaterThan(0);
    }
  });
});

describe("isHoloRarity", () => {
  it("returns true for SECRET_RARE in Pokemon", () => {
    expect(isHoloRarity("POKEMON", "SECRET_RARE")).toBe(true);
  });

  it("returns true for ULTRA_RARE in YGO", () => {
    expect(isHoloRarity("YUGIOH", "ULTRA_RARE")).toBe(true);
  });

  it("returns false for COMMON in any game", () => {
    for (const game of ALL_GAMES) {
      expect(isHoloRarity(game, "COMMON")).toBe(false);
    }
  });

  it("returns false for null rarity", () => {
    expect(isHoloRarity("POKEMON", null)).toBe(false);
  });
});

describe("getCardAspectRatio", () => {
  it("returns game-specific ratios", () => {
    expect(getCardAspectRatio("POKEMON")).toBe("2.5 / 3.5");
    expect(getCardAspectRatio("YUGIOH")).toBe("59 / 86");
    expect(getCardAspectRatio("MTG")).toBe("63 / 88");
    expect(getCardAspectRatio("ONEPIECE")).toBe("59 / 86");
  });
});

describe("getGlowClass", () => {
  it("returns different glow classes per game", () => {
    const glows = new Set(ALL_GAMES.map((g) => getGlowClass(g)));
    expect(glows.size).toBe(4);
  });
});
