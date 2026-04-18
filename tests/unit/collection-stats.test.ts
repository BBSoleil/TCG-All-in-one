import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import {
  getDashboardStats,
  getSetCompletion,
} from "@/features/collection/services/stats";

describe("getDashboardStats", () => {
  beforeEach(() => {
    mockPrisma.$queryRawUnsafe.mockReset();
  });

  it("returns aggregated dashboard stats", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([
        { gameType: "POKEMON", count: 2 },
        { gameType: "MTG", count: 1 },
      ]) // gameRows
      .mockResolvedValueOnce([
        { totalCollections: 3, totalCards: 150, portfolioValue: 1250.5 },
      ]); // summaryRows

    const result = await getDashboardStats("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCollections).toBe(3);
      expect(result.data.totalCards).toBe(150);
      expect(result.data.portfolioValue).toBe(1250.5);
      expect(result.data.collectionsByGame).toHaveLength(2);
      expect(result.data.collectionsByGame[0].gameType).toBe("POKEMON");
    }
  });

  it("returns zeros for user with no collections", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // gameRows
      .mockResolvedValueOnce([
        { totalCollections: 0, totalCards: 0, portfolioValue: 0 },
      ]); // summaryRows

    const result = await getDashboardStats("empty-user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCollections).toBe(0);
      expect(result.data.totalCards).toBe(0);
      expect(result.data.portfolioValue).toBe(0);
      expect(result.data.collectionsByGame).toHaveLength(0);
    }
  });

  it("handles missing summary row (defaults to zeros)", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // gameRows
      .mockResolvedValueOnce([]); // empty summaryRows

    const result = await getDashboardStats("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCollections).toBe(0);
      expect(result.data.totalCards).toBe(0);
      expect(result.data.portfolioValue).toBe(0);
    }
  });

  it("returns error on DB failure", async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error("DB error"));

    const result = await getDashboardStats("user-1");

    expect(result.success).toBe(false);
  });
});

describe("getSetCompletion", () => {
  beforeEach(() => {
    mockPrisma.$queryRawUnsafe.mockReset();
  });

  it("returns set completion data", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { setName: "Base Set", owned: 50, total: 102 },
      { setName: "Jungle", owned: 20, total: 64 },
    ]);

    const result = await getSetCompletion("col-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].setName).toBe("Base Set");
      expect(result.data[0].owned).toBe(50);
      expect(result.data[0].total).toBe(102);
    }
  });

  it("passes 2 params when no gameType", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    await getSetCompletion("col-1", "user-1");

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      "col-1",
      "user-1",
    );
  });

  it("passes 3 params when gameType provided", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    await getSetCompletion("col-1", "user-1", "POKEMON");

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.any(String),
      "col-1",
      "user-1",
      "POKEMON",
    );
  });

  it("uses gameType optimization in SQL when gameType provided", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    await getSetCompletion("col-1", "user-1", "MTG");

    const sql = mockPrisma.$queryRawUnsafe.mock.calls[0]?.[0] as string;
    expect(sql).toContain('"gameType" = $3');
  });

  it("uses correlated subquery when no gameType", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    await getSetCompletion("col-1", "user-1");

    const sql = mockPrisma.$queryRawUnsafe.mock.calls[0]?.[0] as string;
    expect(sql).toContain('SELECT "gameType" FROM "collections"');
  });

  it("returns empty array for empty collection", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await getSetCompletion("col-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("returns error on DB failure", async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error("DB error"));

    const result = await getSetCompletion("col-1", "user-1");

    expect(result.success).toBe(false);
  });
});
