import type { GameFormat, DeckValidationResult } from "../types";
import { GAME_CONFIG } from "@/shared/constants/game-config";
import type { GameType } from "@/shared/types";

export const GAME_FORMATS: GameFormat[] = [
  // Pokemon TCG
  { id: "pokemon-standard", name: "Standard", gameType: "POKEMON", minDeckSize: 60, maxDeckSize: 60, maxCopies: 4, sideboardSize: 0 },
  { id: "pokemon-expanded", name: "Expanded", gameType: "POKEMON", minDeckSize: 60, maxDeckSize: 60, maxCopies: 4, sideboardSize: 0 },
  { id: "pokemon-unlimited", name: "Unlimited", gameType: "POKEMON", minDeckSize: 60, maxDeckSize: 60, maxCopies: 4, sideboardSize: 0 },
  // Yu-Gi-Oh!
  { id: "yugioh-advanced", name: "Advanced", gameType: "YUGIOH", minDeckSize: 40, maxDeckSize: 60, maxCopies: 3, sideboardSize: 15 },
  { id: "yugioh-traditional", name: "Traditional", gameType: "YUGIOH", minDeckSize: 40, maxDeckSize: 60, maxCopies: 3, sideboardSize: 15 },
  // Magic: The Gathering
  { id: "mtg-standard", name: "Standard", gameType: "MTG", minDeckSize: 60, maxDeckSize: 500, maxCopies: 4, sideboardSize: 15 },
  { id: "mtg-modern", name: "Modern", gameType: "MTG", minDeckSize: 60, maxDeckSize: 500, maxCopies: 4, sideboardSize: 15 },
  { id: "mtg-commander", name: "Commander", gameType: "MTG", minDeckSize: 100, maxDeckSize: 100, maxCopies: 1, sideboardSize: 0 },
  { id: "mtg-pioneer", name: "Pioneer", gameType: "MTG", minDeckSize: 60, maxDeckSize: 500, maxCopies: 4, sideboardSize: 15 },
  { id: "mtg-legacy", name: "Legacy", gameType: "MTG", minDeckSize: 60, maxDeckSize: 500, maxCopies: 4, sideboardSize: 15 },
  // One Piece
  { id: "onepiece-standard", name: "Standard", gameType: "ONEPIECE", minDeckSize: 50, maxDeckSize: 50, maxCopies: 4, sideboardSize: 0 },
];

export function getFormatsForGame(gameType: string): GameFormat[] {
  return GAME_FORMATS.filter((f) => f.gameType === gameType);
}

export function getFormatById(formatId: string): GameFormat | undefined {
  return GAME_FORMATS.find((f) => f.id === formatId);
}

export interface DeckValidationCard {
  cardId: string;
  cardName: string;
  quantity: number;
  isSideboard: boolean;
  /** "Leader" | "Character" | "Event" | "Stage" for One Piece, optional for others */
  cardType?: string | null;
}

export function validateDeck(
  cards: DeckValidationCard[],
  format: GameFormat | null,
  gameType?: GameType,
): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const mainCards = cards.filter((c) => !c.isSideboard);
  const sideboardCards = cards.filter((c) => c.isSideboard);

  const mainTotal = mainCards.reduce((sum, c) => sum + c.quantity, 0);
  const sideTotal = sideboardCards.reduce((sum, c) => sum + c.quantity, 0);

  // Game-type-level rules apply even without a format selected. Pulled from
  // GAME_CONFIG so the source of truth lives in one place.
  if (gameType) {
    const cfg = GAME_CONFIG[gameType];
    if (!format) {
      if (mainTotal > 0 && mainTotal < cfg.deckRules.minCards) {
        warnings.push(
          `Deck has ${mainTotal} cards but ${gameType} typically needs at least ${cfg.deckRules.minCards}`,
        );
      }
      if (cfg.deckRules.maxCards && mainTotal > cfg.deckRules.maxCards) {
        errors.push(
          `Deck exceeds ${gameType} max of ${cfg.deckRules.maxCards} cards (currently ${mainTotal})`,
        );
      }
      // Basic copy limit — format-less validation still enforces the global max
      const globalCounts = new Map<string, { name: string; total: number }>();
      for (const c of cards) {
        const e = globalCounts.get(c.cardId);
        if (e) e.total += c.quantity;
        else globalCounts.set(c.cardId, { name: c.cardName, total: c.quantity });
      }
      for (const [, { name, total }] of globalCounts) {
        if (total > cfg.deckRules.maxCopies) {
          errors.push(`"${name}" exceeds ${gameType} copy limit of ${cfg.deckRules.maxCopies}`);
        }
      }
    }

    // One Piece: exactly one Leader card, outside the main deck count.
    if (gameType === "ONEPIECE") {
      const leaders = cards.filter(
        (c) => c.cardType?.toLowerCase() === "leader",
      );
      const leaderCount = leaders.reduce((sum, c) => sum + c.quantity, 0);
      if (leaderCount === 0 && mainTotal > 0) {
        errors.push("One Piece deck requires exactly 1 Leader card");
      } else if (leaderCount > 1) {
        errors.push(`One Piece deck can only have 1 Leader (found ${leaderCount})`);
      }
    }
  }

  if (!format) {
    if (mainTotal === 0) {
      errors.push("Deck must contain at least one card");
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  // Deck size checks
  if (mainTotal < format.minDeckSize) {
    errors.push(`Main deck needs at least ${format.minDeckSize} cards (currently ${mainTotal})`);
  }
  if (mainTotal > format.maxDeckSize) {
    errors.push(`Main deck exceeds maximum of ${format.maxDeckSize} cards (currently ${mainTotal})`);
  }

  // Sideboard check
  if (format.sideboardSize > 0 && sideTotal > format.sideboardSize) {
    errors.push(`Sideboard exceeds maximum of ${format.sideboardSize} cards (currently ${sideTotal})`);
  }
  if (format.sideboardSize === 0 && sideTotal > 0) {
    warnings.push(`${format.name} format does not use a sideboard`);
  }

  // Copy limit checks
  const cardCounts = new Map<string, { name: string; total: number }>();
  for (const c of cards) {
    const existing = cardCounts.get(c.cardId);
    if (existing) {
      existing.total += c.quantity;
    } else {
      cardCounts.set(c.cardId, { name: c.cardName, total: c.quantity });
    }
  }

  for (const [, { name, total }] of cardCounts) {
    if (total > format.maxCopies) {
      errors.push(`"${name}" exceeds copy limit of ${format.maxCopies} (has ${total})`);
    }
  }

  // Game-specific warnings
  if (format.gameType === "POKEMON" && mainTotal === format.minDeckSize) {
    const hasBasicEnergy = mainCards.some((c) =>
      c.cardName.toLowerCase().includes("energy"),
    );
    if (!hasBasicEnergy) {
      warnings.push("Deck has no Energy cards — this may be intentional for some strategies");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
