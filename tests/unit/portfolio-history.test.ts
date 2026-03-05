import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { recordPortfolioSnapshot, getPortfolioHistory } from "@/features/collection/services/portfolio-history";

describe("recordPortfolioSnapshot", () => {
  beforeEach(() => {
    mockPrisma.$queryRawUnsafe.mockReset();
    mockPrisma.portfolioSnapshot.create.mockReset();
  });

  it("records snapshot with correct value and card count", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { totalValue: 55, cardCount: 6 },
    ]);
    mockPrisma.portfolioSnapshot.create.mockResolvedValue({ id: "snap-1" });

    const result = await recordPortfolioSnapshot("user-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.portfolioSnapshot.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        value: 55,
        cardCount: 6,
      },
    });
  });

  it("records zero values for empty collection", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { totalValue: 0, cardCount: 0 },
    ]);
    mockPrisma.portfolioSnapshot.create.mockResolvedValue({ id: "snap-2" });

    const result = await recordPortfolioSnapshot("empty-user");

    expect(result.success).toBe(true);
    expect(mockPrisma.portfolioSnapshot.create).toHaveBeenCalledWith({
      data: { userId: "empty-user", value: 0, cardCount: 0 },
    });
  });
});

describe("getPortfolioHistory", () => {
  beforeEach(() => {
    mockPrisma.portfolioSnapshot.findMany.mockReset();
  });

  it("returns formatted data points", async () => {
    mockPrisma.portfolioSnapshot.findMany.mockResolvedValue([
      { value: 100, cardCount: 10, recordedAt: new Date("2026-03-01") },
      { value: 150, cardCount: 15, recordedAt: new Date("2026-03-02") },
    ]);

    const result = await getPortfolioHistory("user-1", 30);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]?.date).toBe("2026-03-01");
      expect(result.data[0]?.value).toBe(100);
      expect(result.data[1]?.value).toBe(150);
    }
  });

  it("returns empty array for no history", async () => {
    mockPrisma.portfolioSnapshot.findMany.mockResolvedValue([]);

    const result = await getPortfolioHistory("new-user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });
});
