import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { analyzeDeck } from "@/features/decks/services/analysis";

function makeDeckCard(overrides: Record<string, unknown> = {}) {
  return {
    id: "dc-1",
    deckId: "deck-1",
    cardId: "card-1",
    quantity: 1,
    isSideboard: false,
    card: {
      id: "card-1",
      name: "Lightning Bolt",
      rarity: "Common",
      marketPrice: 2.5,
      pokemonDetails: null,
      yugiohDetails: null,
      mtgDetails: {
        cmc: 1,
        typeLine: "Instant",
        colors: ["Red"],
      },
      onepieceDetails: null,
    },
    ...overrides,
  };
}

describe("analyzeDeck", () => {
  beforeEach(() => {
    mockPrisma.deckCard.findMany.mockReset();
  });

  it("returns empty analysis for empty deck", async () => {
    mockPrisma.deckCard.findMany.mockResolvedValue([]);

    const result = await analyzeDeck("empty-deck");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCards).toBe(0);
      expect(result.data.sideboardCards).toBe(0);
      expect(result.data.estimatedValue).toBe(0);
      expect(result.data.costCurve).toHaveLength(0);
    }
  });

  it("computes cost curve from MTG CMC", async () => {
    mockPrisma.deckCard.findMany.mockResolvedValue([
      makeDeckCard({ card: { ...makeDeckCard().card, mtgDetails: { cmc: 1, typeLine: "Instant", colors: ["Red"] } } }),
      makeDeckCard({
        id: "dc-2",
        cardId: "card-2",
        quantity: 3,
        card: {
          id: "card-2",
          name: "Counterspell",
          rarity: "Common",
          marketPrice: 1,
          pokemonDetails: null,
          yugiohDetails: null,
          mtgDetails: { cmc: 2, typeLine: "Instant", colors: ["Blue"] },
          onepieceDetails: null,
        },
      }),
    ]);

    const result = await analyzeDeck("deck-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.costCurve).toEqual([
        { cost: 1, count: 1 },
        { cost: 2, count: 3 },
      ]);
    }
  });

  it("computes type breakdown", async () => {
    mockPrisma.deckCard.findMany.mockResolvedValue([
      makeDeckCard({ quantity: 4 }),
      makeDeckCard({
        id: "dc-2",
        cardId: "card-2",
        quantity: 2,
        card: {
          id: "card-2",
          name: "Grizzly Bears",
          rarity: "Common",
          marketPrice: 0.1,
          pokemonDetails: null,
          yugiohDetails: null,
          mtgDetails: { cmc: 2, typeLine: "Creature — Bear", colors: ["Green"] },
          onepieceDetails: null,
        },
      }),
    ]);

    const result = await analyzeDeck("deck-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.typeBreakdown).toEqual(
        expect.arrayContaining([
          { type: "Instant", count: 4 },
          { type: "Creature", count: 2 },
        ]),
      );
    }
  });

  it("computes estimated value across main + sideboard", async () => {
    mockPrisma.deckCard.findMany.mockResolvedValue([
      makeDeckCard({ quantity: 4, card: { ...makeDeckCard().card, marketPrice: 10 } }),
      makeDeckCard({
        id: "dc-2",
        cardId: "card-2",
        quantity: 2,
        isSideboard: true,
        card: {
          ...makeDeckCard().card,
          id: "card-2",
          marketPrice: 5,
        },
      }),
    ]);

    const result = await analyzeDeck("deck-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estimatedValue).toBe(50); // 4*10 + 2*5
      expect(result.data.totalCards).toBe(4); // main only
      expect(result.data.sideboardCards).toBe(2);
    }
  });

  it("handles attribute breakdown with multi-color cards", async () => {
    mockPrisma.deckCard.findMany.mockResolvedValue([
      makeDeckCard({
        quantity: 2,
        card: {
          ...makeDeckCard().card,
          mtgDetails: { cmc: 3, typeLine: "Creature", colors: ["White", "Blue"] },
        },
      }),
    ]);

    const result = await analyzeDeck("deck-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attributeBreakdown).toEqual(
        expect.arrayContaining([
          { attribute: "White", count: 2 },
          { attribute: "Blue", count: 2 },
        ]),
      );
    }
  });
});
