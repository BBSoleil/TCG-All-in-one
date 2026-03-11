import { describe, it, expect } from "vitest";
import { GAME_CONFIG, isHoloRarity } from "@/shared/constants/game-config";

/**
 * Tests for CardImage helper logic. We test the pure functions that
 * CardImage relies on, since the component itself requires a DOM.
 */

describe("CardImage helper logic", () => {
  describe("aspect ratio per game", () => {
    it("Pokemon has 2.5/3.5 ratio (standard TCG)", () => {
      expect(GAME_CONFIG.POKEMON.cardRatio).toBe("2.5 / 3.5");
    });

    it("Yu-Gi-Oh has 59/86 ratio (taller than standard)", () => {
      expect(GAME_CONFIG.YUGIOH.cardRatio).toBe("59 / 86");
    });

    it("MTG has 63/88 ratio", () => {
      expect(GAME_CONFIG.MTG.cardRatio).toBe("63 / 88");
    });

    it("One Piece matches Yu-Gi-Oh ratio", () => {
      expect(GAME_CONFIG.ONEPIECE.cardRatio).toBe(GAME_CONFIG.YUGIOH.cardRatio);
    });
  });

  describe("holo detection for card rendering", () => {
    it("RARE triggers holo in Pokemon and MTG", () => {
      expect(isHoloRarity("POKEMON", "RARE")).toBe(true);
      expect(isHoloRarity("MTG", "RARE")).toBe(true);
    });

    it("RARE does NOT trigger holo in YGO and One Piece", () => {
      expect(isHoloRarity("YUGIOH", "RARE")).toBe(false);
      expect(isHoloRarity("ONEPIECE", "RARE")).toBe(false);
    });

    it("SPECIAL triggers holo in all games", () => {
      expect(isHoloRarity("POKEMON", "SPECIAL")).toBe(true);
      expect(isHoloRarity("YUGIOH", "SPECIAL")).toBe(true);
      expect(isHoloRarity("MTG", "SPECIAL")).toBe(true);
      expect(isHoloRarity("ONEPIECE", "SPECIAL")).toBe(true);
    });

    it("UNCOMMON never triggers holo", () => {
      expect(isHoloRarity("POKEMON", "UNCOMMON")).toBe(false);
      expect(isHoloRarity("YUGIOH", "UNCOMMON")).toBe(false);
      expect(isHoloRarity("MTG", "UNCOMMON")).toBe(false);
      expect(isHoloRarity("ONEPIECE", "UNCOMMON")).toBe(false);
    });

    it("empty string does not trigger holo", () => {
      expect(isHoloRarity("POKEMON", "")).toBe(false);
    });

    it("unknown rarity string does not trigger holo", () => {
      expect(isHoloRarity("POKEMON", "MYTHIC")).toBe(false);
    });
  });

  describe("glow colors are distinct per game", () => {
    it("each game has a unique glow color", () => {
      const colors = [
        GAME_CONFIG.POKEMON.glowColor,
        GAME_CONFIG.YUGIOH.glowColor,
        GAME_CONFIG.MTG.glowColor,
        GAME_CONFIG.ONEPIECE.glowColor,
      ];
      const unique = new Set(colors);
      expect(unique.size).toBe(4);
    });
  });
});
