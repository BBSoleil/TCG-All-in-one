import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { getLeaderboard } from "@/features/social/services/leaderboards";

describe("getLeaderboard", () => {
  beforeEach(() => {
    mockPrisma.user.findMany.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
  });

  it("returns followers leaderboard sorted by count", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "u1", name: "Alice", image: null, _count: { followers: 50 } },
      { id: "u2", name: "Bob", image: null, _count: { followers: 30 } },
    ]);

    const result = await getLeaderboard("followers");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.rank).toBe(1);
      expect(result.data[0]?.userName).toBe("Alice");
      expect(result.data[0]?.value).toBe(50);
      expect(result.data[1]?.rank).toBe(2);
    }
  });

  it("returns achievements leaderboard filtering zero entries", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "u1", name: "Alice", image: null, _count: { achievements: 5 } },
      { id: "u2", name: "Bob", image: null, _count: { achievements: 0 } },
    ]);

    const result = await getLeaderboard("achievements");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.userName).toBe("Alice");
    }
  });

  it("returns portfolio leaderboard with calculated values", async () => {
    // Portfolio now uses $queryRawUnsafe for optimization
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { id: "u1", name: "Whale", image: null, value: 250 },
      { id: "u2", name: "Starter", image: null, value: 5 },
    ]);

    const result = await getLeaderboard("portfolio");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0]?.userName).toBe("Whale");
      expect(result.data[0]?.value).toBe(250);
      expect(result.data[1]?.value).toBe(5);
    }
  });

  it("returns trades leaderboard combining sales and purchases", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "u1", name: "Trader", image: null, _count: { salesMade: 10, purchases: 5 } },
      { id: "u2", name: "Buyer", image: null, _count: { salesMade: 0, purchases: 3 } },
      { id: "u3", name: "Lurker", image: null, _count: { salesMade: 0, purchases: 0 } },
    ]);

    const result = await getLeaderboard("trades");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2); // Lurker filtered out
      expect(result.data[0]?.value).toBe(15);
      expect(result.data[1]?.value).toBe(3);
    }
  });

  it("handles database errors gracefully", async () => {
    mockPrisma.user.findMany.mockRejectedValue(new Error("Connection refused"));

    const result = await getLeaderboard("followers");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Connection refused");
    }
  });
});
