import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { getTopPriceMovers, getMarketOverview } from "@/features/market/services/market-stats";

describe("getTopPriceMovers", () => {
  beforeEach(() => {
    mockPrisma.$queryRawUnsafe.mockReset();
  });

  it("returns price movers from raw SQL query", async () => {
    const movers = [
      {
        cardId: "card-1",
        cardName: "Charizard",
        gameType: "POKEMON",
        imageUrl: "https://example.com/charizard.jpg",
        currentPrice: 150,
        previousPrice: 100,
        changePercent: 50,
      },
    ];
    mockPrisma.$queryRawUnsafe.mockResolvedValue(movers);

    const result = await getTopPriceMovers(10);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cardName).toBe("Charizard");
      expect(result.data[0].changePercent).toBe(50);
    }
  });

  it("returns empty array when no price history", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await getTopPriceMovers();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("returns empty array on DB error (graceful fallback)", async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error("DB connection failed"));

    const result = await getTopPriceMovers();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("passes limit parameter to query", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    await getTopPriceMovers(5);

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      5,
    );
  });

  it("defaults limit to 10", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    await getTopPriceMovers();

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      10,
    );
  });
});

describe("getMarketOverview", () => {
  beforeEach(() => {
    mockPrisma.listing.count.mockReset();
    mockPrisma.transaction.count.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
  });

  it("returns complete market overview", async () => {
    mockPrisma.listing.count.mockResolvedValue(42);
    mockPrisma.transaction.count.mockResolvedValue(7);
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([{ gameType: "POKEMON", avgPrice: 12.5, listingCount: 20 }]) // avgByGame
      .mockResolvedValueOnce([{ cardId: "c1", cardName: "Pikachu", gameType: "POKEMON", imageUrl: null, listingCount: 5 }]) // hotCards
      .mockResolvedValueOnce([]) // getTopPriceMovers (called internally)
    ;

    const result = await getMarketOverview();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalActiveListings).toBe(42);
      expect(result.data.transactionsLast24h).toBe(7);
      expect(result.data.avgPriceByGame).toHaveLength(1);
      expect(result.data.avgPriceByGame[0].gameType).toBe("POKEMON");
      expect(result.data.hotCards).toHaveLength(1);
      expect(result.data.topMovers).toHaveLength(0);
    }
  });

  it("handles movers failure gracefully (returns empty array)", async () => {
    mockPrisma.listing.count.mockResolvedValue(0);
    mockPrisma.transaction.count.mockResolvedValue(0);
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // avgByGame
      .mockResolvedValueOnce([]) // hotCards
      .mockRejectedValueOnce(new Error("movers query failed")) // getTopPriceMovers fails
    ;

    const result = await getMarketOverview();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topMovers).toEqual([]);
    }
  });

  it("returns error on complete failure", async () => {
    mockPrisma.listing.count.mockRejectedValue(new Error("DB down"));

    const result = await getMarketOverview();

    expect(result.success).toBe(false);
  });

  it("returns zero counts for empty marketplace", async () => {
    mockPrisma.listing.count.mockResolvedValue(0);
    mockPrisma.transaction.count.mockResolvedValue(0);
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await getMarketOverview();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalActiveListings).toBe(0);
      expect(result.data.transactionsLast24h).toBe(0);
      expect(result.data.avgPriceByGame).toHaveLength(0);
      expect(result.data.hotCards).toHaveLength(0);
    }
  });
});
