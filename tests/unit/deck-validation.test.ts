import { describe, it, expect } from "vitest";
import { validateDeck, getFormatsForGame, getFormatById } from "@/features/decks/services/formats";
import type { GameFormat } from "@/features/decks/types";

function makeCards(
  count: number,
  opts: { isSideboard?: boolean; name?: string } = {},
) {
  return Array.from({ length: count }, (_, i) => ({
    cardId: `card-${i}`,
    cardName: opts.name ?? `Card ${i}`,
    quantity: 1,
    isSideboard: opts.isSideboard ?? false,
  }));
}

function makeCopies(
  cardId: string,
  name: string,
  quantity: number,
  isSideboard = false,
) {
  return { cardId, cardName: name, quantity, isSideboard };
}

describe("getFormatsForGame", () => {
  it("returns 3 Pokemon formats", () => {
    expect(getFormatsForGame("POKEMON")).toHaveLength(3);
  });

  it("returns 2 Yu-Gi-Oh! formats", () => {
    expect(getFormatsForGame("YUGIOH")).toHaveLength(2);
  });

  it("returns 5 MTG formats", () => {
    expect(getFormatsForGame("MTG")).toHaveLength(5);
  });

  it("returns 1 One Piece format", () => {
    expect(getFormatsForGame("ONEPIECE")).toHaveLength(1);
  });

  it("returns empty for unknown game", () => {
    expect(getFormatsForGame("DIGIMON")).toHaveLength(0);
  });
});

describe("getFormatById", () => {
  it("returns format by ID", () => {
    const format = getFormatById("mtg-commander");
    expect(format).toBeDefined();
    expect(format?.name).toBe("Commander");
    expect(format?.maxCopies).toBe(1);
  });

  it("returns undefined for unknown format", () => {
    expect(getFormatById("fake-format")).toBeUndefined();
  });
});

describe("validateDeck", () => {
  const pokemonStandard = getFormatById("pokemon-standard") as GameFormat;
  const yugiohAdvanced = getFormatById("yugioh-advanced") as GameFormat;
  const mtgCommander = getFormatById("mtg-commander") as GameFormat;
  const mtgStandard = getFormatById("mtg-standard") as GameFormat;
  const onepieceStandard = getFormatById("onepiece-standard") as GameFormat;

  it("validates a legal Pokemon Standard deck (60 cards)", () => {
    const cards = makeCards(60);
    const result = validateDeck(cards, pokemonStandard);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects Pokemon deck with too few cards", () => {
    const cards = makeCards(40);
    const result = validateDeck(cards, pokemonStandard);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("at least 60 cards");
  });

  it("warns Pokemon deck with no Energy cards", () => {
    const cards = makeCards(60);
    const result = validateDeck(cards, pokemonStandard);

    expect(result.warnings.some((w) => w.includes("Energy"))).toBe(true);
  });

  it("no energy warning when deck has energy cards", () => {
    const cards = [
      ...makeCards(55),
      ...makeCards(5, { name: "Fire Energy" }),
    ];
    const result = validateDeck(cards, pokemonStandard);

    expect(result.warnings.some((w) => w.includes("Energy"))).toBe(false);
  });

  it("warns when sideboard used in Pokemon (sideboardSize = 0)", () => {
    const cards = [
      ...makeCards(60),
      ...makeCards(5, { isSideboard: true }),
    ];
    const result = validateDeck(cards, pokemonStandard);

    expect(result.valid).toBe(true); // sideboard warning, not error
    expect(result.warnings.some((w) => w.includes("sideboard"))).toBe(true);
  });

  it("validates YGO deck with 40-60 range", () => {
    const result40 = validateDeck(makeCards(40), yugiohAdvanced);
    expect(result40.valid).toBe(true);

    const result60 = validateDeck(makeCards(60), yugiohAdvanced);
    expect(result60.valid).toBe(true);
  });

  it("rejects YGO deck under 40 cards", () => {
    const result = validateDeck(makeCards(30), yugiohAdvanced);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("at least 40 cards");
  });

  it("rejects YGO sideboard over 15", () => {
    const cards = [
      ...makeCards(40),
      ...makeCards(16, { isSideboard: true }),
    ];
    const result = validateDeck(cards, yugiohAdvanced);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Sideboard exceeds"))).toBe(true);
  });

  it("enforces YGO max 3 copies", () => {
    const cards = [
      makeCopies("card-a", "Dark Magician", 4, false),
      ...makeCards(36),
    ];
    const result = validateDeck(cards, yugiohAdvanced);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("copy limit of 3"))).toBe(true);
  });

  it("validates MTG Commander (exactly 100, max 1 copy)", () => {
    const cards = makeCards(100);
    const result = validateDeck(cards, mtgCommander);

    expect(result.valid).toBe(true);
  });

  it("rejects MTG Commander with wrong size", () => {
    const result = validateDeck(makeCards(60), mtgCommander);
    expect(result.valid).toBe(false);
  });

  it("enforces MTG Commander singleton", () => {
    const cards = [
      makeCopies("card-a", "Lightning Bolt", 2, false),
      ...makeCards(98),
    ];
    const result = validateDeck(cards, mtgCommander);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("copy limit of 1"))).toBe(true);
  });

  it("validates One Piece deck (exactly 50)", () => {
    const cards = makeCards(50);
    const result = validateDeck(cards, onepieceStandard);

    expect(result.valid).toBe(true);
  });

  it("allows MTG Standard sideboard up to 15", () => {
    const cards = [
      ...makeCards(60),
      ...makeCards(15, { isSideboard: true }),
    ];
    const result = validateDeck(cards, mtgStandard);

    expect(result.valid).toBe(true);
  });

  it("validates with no format (basic validation)", () => {
    const result = validateDeck(makeCards(10), null);
    expect(result.valid).toBe(true);

    const emptyResult = validateDeck([], null);
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.errors[0]).toContain("at least one card");
  });
});
