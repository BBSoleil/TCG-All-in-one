import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { getAnalytics } from "@/features/analytics/services";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAnalytics", () => {
  it("returns empty data for user with no cards", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // game breakdown
      .mockResolvedValueOnce([]) // rarity breakdown
      .mockResolvedValueOnce([]) // top cards
      .mockResolvedValueOnce([{ totalCardCopies: 0, totalUniqueCards: 0, totalValue: 0 }]); // summary
    mockPrisma.collection.count.mockResolvedValue(2);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.totalUniqueCards).toBe(0);
    expect(result.data.totalCardCopies).toBe(0);
    expect(result.data.totalValue).toBe(0);
    expect(result.data.avgCardValue).toBe(0);
    expect(result.data.gameBreakdown).toEqual([]);
    expect(result.data.rarityBreakdown).toEqual([]);
    expect(result.data.topCards).toEqual([]);
  });

  it("calculates game breakdown correctly", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([
        { gameType: "POKEMON", cardCount: 4, totalValue: 115 },
        { gameType: "YUGIOH", cardCount: 2, totalValue: 40 },
      ]) // game breakdown
      .mockResolvedValueOnce([]) // rarity
      .mockResolvedValueOnce([]) // top cards
      .mockResolvedValueOnce([{ totalCardCopies: 6, totalUniqueCards: 3, totalValue: 155 }]); // summary
    mockPrisma.collection.count.mockResolvedValue(2);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.gameBreakdown).toHaveLength(2);
    const pokemon = result.data.gameBreakdown.find((g) => g.gameType === "POKEMON");
    expect(pokemon).toBeDefined();
    expect(pokemon?.cardCount).toBe(4);
    expect(pokemon?.totalValue).toBe(115);
  });

  it("calculates rarity breakdown correctly", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // game
      .mockResolvedValueOnce([
        { rarity: "COMMON", count: 3 },
        { rarity: "RARE", count: 1 },
      ]) // rarity breakdown
      .mockResolvedValueOnce([]) // top cards
      .mockResolvedValueOnce([{ totalCardCopies: 4, totalUniqueCards: 3, totalValue: 0 }]); // summary
    mockPrisma.collection.count.mockResolvedValue(2);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const common = result.data.rarityBreakdown.find((r) => r.rarity === "COMMON");
    expect(common?.count).toBe(3);
    const rare = result.data.rarityBreakdown.find((r) => r.rarity === "RARE");
    expect(rare?.count).toBe(1);
  });

  it("returns top cards sorted by total value", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // game
      .mockResolvedValueOnce([]) // rarity
      .mockResolvedValueOnce([
        { id: "c2", name: "Expensive", gameType: "MTG", setName: null, imageUrl: null, marketPrice: 50, quantity: 4, totalValue: 200 },
        { id: "c3", name: "Mid", gameType: "MTG", setName: null, imageUrl: null, marketPrice: 10, quantity: 2, totalValue: 20 },
        { id: "c1", name: "Cheap", gameType: "MTG", setName: null, imageUrl: null, marketPrice: 1, quantity: 1, totalValue: 1 },
      ]) // top cards
      .mockResolvedValueOnce([{ totalCardCopies: 7, totalUniqueCards: 3, totalValue: 221 }]); // summary
    mockPrisma.collection.count.mockResolvedValue(2);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.topCards[0]?.name).toBe("Expensive");
    expect(result.data.topCards[0]?.totalValue).toBe(200);
    expect(result.data.topCards[1]?.name).toBe("Mid");
    expect(result.data.topCards[2]?.name).toBe("Cheap");
  });

  it("handles null marketPrice cards", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ gameType: "POKEMON", cardCount: 5, totalValue: 0 }]) // game
      .mockResolvedValueOnce([{ rarity: "Unknown", count: 5 }]) // rarity
      .mockResolvedValueOnce([]) // top cards (no priced cards)
      .mockResolvedValueOnce([{ totalCardCopies: 5, totalUniqueCards: 1, totalValue: 0 }]); // summary
    mockPrisma.collection.count.mockResolvedValue(2);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.totalValue).toBe(0);
    expect(result.data.avgCardValue).toBe(0);
    expect(result.data.topCards).toHaveLength(0);
    expect(result.data.totalCardCopies).toBe(5);
    expect(result.data.rarityBreakdown).toEqual([{ rarity: "Unknown", count: 5 }]);
  });

  it("calculates summary stats correctly", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ gameType: "POKEMON", cardCount: 5, totalValue: 80 }]) // game
      .mockResolvedValueOnce([{ rarity: "COMMON", count: 2 }, { rarity: "RARE", count: 3 }]) // rarity
      .mockResolvedValueOnce([]) // top cards
      .mockResolvedValueOnce([{ totalCardCopies: 5, totalUniqueCards: 2, totalValue: 80 }]); // summary
    mockPrisma.collection.count.mockResolvedValue(2);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.totalUniqueCards).toBe(2);
    expect(result.data.totalCardCopies).toBe(5);
    expect(result.data.totalValue).toBe(80);
    expect(result.data.avgCardValue).toBe(16);
    expect(result.data.collectionsCount).toBe(2);
  });
});
