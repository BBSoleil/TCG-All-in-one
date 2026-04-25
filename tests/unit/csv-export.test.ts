import { describe, it, expect } from "vitest";
import { generateCSV } from "@/features/collection/services/csv-export";
import type { CollectionCardWithDetails } from "@/features/collection/services";

function makeCard(overrides: Partial<CollectionCardWithDetails> = {}): CollectionCardWithDetails {
  return {
    id: "cc-1",
    quantity: 1,
    condition: "Near Mint",
    language: "EN",
    foil: false,
    forSale: false,
    forTrade: false,
    notes: null,
    addedAt: new Date("2024-01-01"),
    card: {
      id: "card-1",
      name: "Pikachu",
      gameType: "POKEMON",
      setName: "Base Set",
      rarity: "COMMON",
      imageUrl: null,
      marketPrice: 5.5,
    },
    ...overrides,
  };
}

describe("generateCSV", () => {
  it("generates headers for empty array", () => {
    const csv = generateCSV([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("Name,Game,Set,Rarity,Quantity,Condition,Market Price,Total Value,Notes");
  });

  it("generates correct row for a card", () => {
    const csv = generateCSV([makeCard()]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("Pikachu,POKEMON,Base Set,COMMON,1,Near Mint,5.50,5.50,");
  });

  it("calculates total value as price * quantity", () => {
    const card = makeCard({ quantity: 3, card: { ...makeCard().card, marketPrice: 10 } });
    const csv = generateCSV([card]);
    const lines = csv.split("\n");
    expect(lines[1]).toContain("30.00");
  });

  it("handles null market price", () => {
    const card = makeCard({ card: { ...makeCard().card, marketPrice: null } });
    const csv = generateCSV([card]);
    const lines = csv.split("\n");
    // Price and total value should be empty
    expect(lines[1]).toBe("Pikachu,POKEMON,Base Set,COMMON,1,Near Mint,,,");
  });

  it("escapes commas in values", () => {
    const card = makeCard({
      card: { ...makeCard().card, name: "Dark Magician, the Ultimate" },
    });
    const csv = generateCSV([card]);
    expect(csv).toContain('"Dark Magician, the Ultimate"');
  });

  it("escapes quotes in values", () => {
    const card = makeCard({
      notes: 'Card says "hello"',
    });
    const csv = generateCSV([card]);
    expect(csv).toContain('"Card says ""hello"""');
  });

  it("handles null set, rarity and empty condition/notes", () => {
    const card = makeCard({
      condition: "",
      notes: null,
      card: {
        ...makeCard().card,
        setName: null,
        rarity: null,
      },
    });
    const csv = generateCSV([card]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("Pikachu,POKEMON,,,1,,5.50,5.50,");
  });

  it("handles multiple cards", () => {
    const cards = [
      makeCard(),
      makeCard({
        id: "cc-2",
        quantity: 2,
        card: { ...makeCard().card, id: "card-2", name: "Charizard", marketPrice: 100 },
      }),
    ];
    const csv = generateCSV(cards);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
  });
});
