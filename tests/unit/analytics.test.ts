import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    collectionCard: {
      findMany: vi.fn(),
    },
    collection: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/shared/lib/prisma";
import { getAnalytics } from "@/features/analytics/services";

const mockCollectionCardFindMany = prisma.collectionCard.findMany as ReturnType<typeof vi.fn>;
const mockCollectionCount = prisma.collection.count as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockCollectionCount.mockResolvedValue(2);
});

describe("getAnalytics", () => {
  it("returns empty data for user with no cards", async () => {
    mockCollectionCardFindMany.mockResolvedValue([]);

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
    mockCollectionCardFindMany.mockResolvedValue([
      { quantity: 3, card: { id: "c1", name: "Pikachu", gameType: "POKEMON", setName: "Base", rarity: "COMMON", imageUrl: null, marketPrice: 5 } },
      { quantity: 1, card: { id: "c2", name: "Charizard", gameType: "POKEMON", setName: "Base", rarity: "RARE", imageUrl: null, marketPrice: 100 } },
      { quantity: 2, card: { id: "c3", name: "Dark Magician", gameType: "YUGIOH", setName: "LOB", rarity: "ULTRA_RARE", imageUrl: null, marketPrice: 20 } },
    ]);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.gameBreakdown).toHaveLength(2);
    const pokemon = result.data.gameBreakdown.find((g) => g.gameType === "POKEMON");
    expect(pokemon).toBeDefined();
    expect(pokemon?.cardCount).toBe(4); // 3 + 1
    expect(pokemon?.totalValue).toBe(115); // 3*5 + 1*100
  });

  it("calculates rarity breakdown correctly", async () => {
    mockCollectionCardFindMany.mockResolvedValue([
      { quantity: 2, card: { id: "c1", name: "A", gameType: "POKEMON", setName: null, rarity: "COMMON", imageUrl: null, marketPrice: null } },
      { quantity: 1, card: { id: "c2", name: "B", gameType: "POKEMON", setName: null, rarity: "COMMON", imageUrl: null, marketPrice: null } },
      { quantity: 1, card: { id: "c3", name: "C", gameType: "POKEMON", setName: null, rarity: "RARE", imageUrl: null, marketPrice: null } },
    ]);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    const common = result.data.rarityBreakdown.find((r) => r.rarity === "COMMON");
    expect(common?.count).toBe(3); // 2 + 1
    const rare = result.data.rarityBreakdown.find((r) => r.rarity === "RARE");
    expect(rare?.count).toBe(1);
  });

  it("returns top cards sorted by total value", async () => {
    mockCollectionCardFindMany.mockResolvedValue([
      { quantity: 1, card: { id: "c1", name: "Cheap", gameType: "MTG", setName: null, rarity: "COMMON", imageUrl: null, marketPrice: 1 } },
      { quantity: 4, card: { id: "c2", name: "Expensive", gameType: "MTG", setName: null, rarity: "RARE", imageUrl: null, marketPrice: 50 } },
      { quantity: 2, card: { id: "c3", name: "Mid", gameType: "MTG", setName: null, rarity: "UNCOMMON", imageUrl: null, marketPrice: 10 } },
    ]);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.topCards[0]?.name).toBe("Expensive");
    expect(result.data.topCards[0]?.totalValue).toBe(200); // 4 * 50
    expect(result.data.topCards[1]?.name).toBe("Mid");
    expect(result.data.topCards[2]?.name).toBe("Cheap");
  });

  it("handles null marketPrice cards", async () => {
    mockCollectionCardFindMany.mockResolvedValue([
      { quantity: 5, card: { id: "c1", name: "Free", gameType: "POKEMON", setName: null, rarity: null, imageUrl: null, marketPrice: null } },
    ]);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.totalValue).toBe(0);
    expect(result.data.avgCardValue).toBe(0);
    expect(result.data.topCards).toHaveLength(0); // excluded from top cards
    expect(result.data.totalCardCopies).toBe(5);
    expect(result.data.rarityBreakdown).toEqual([{ rarity: "Unknown", count: 5 }]);
  });

  it("calculates summary stats correctly", async () => {
    mockCollectionCardFindMany.mockResolvedValue([
      { quantity: 2, card: { id: "c1", name: "A", gameType: "POKEMON", setName: null, rarity: "COMMON", imageUrl: null, marketPrice: 10 } },
      { quantity: 3, card: { id: "c2", name: "B", gameType: "POKEMON", setName: null, rarity: "RARE", imageUrl: null, marketPrice: 20 } },
    ]);

    const result = await getAnalytics("user-1");
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.totalUniqueCards).toBe(2);
    expect(result.data.totalCardCopies).toBe(5); // 2 + 3
    expect(result.data.totalValue).toBe(80); // 2*10 + 3*20
    expect(result.data.avgCardValue).toBe(16); // 80 / 5
    expect(result.data.collectionsCount).toBe(2);
  });
});
