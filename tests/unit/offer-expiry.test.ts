import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { expireStaleOffers } from "@/features/market/services/offer-expiry";

describe("expireStaleOffers", () => {
  beforeEach(() => {
    mockPrisma.offer.updateMany.mockReset();
  });

  it("expires pending offers past expiresAt", async () => {
    mockPrisma.offer.updateMany.mockResolvedValue({ count: 3 });

    const result = await expireStaleOffers();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expired).toBe(3);
    }
    expect(mockPrisma.offer.updateMany).toHaveBeenCalledWith({
      where: {
        status: "PENDING",
        expiresAt: { lte: expect.any(Date) },
      },
      data: { status: "EXPIRED" },
    });
  });

  it("returns 0 when no stale offers exist", async () => {
    mockPrisma.offer.updateMany.mockResolvedValue({ count: 0 });

    const result = await expireStaleOffers();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expired).toBe(0);
    }
  });

  it("handles database errors gracefully", async () => {
    mockPrisma.offer.updateMany.mockRejectedValue(new Error("DB connection lost"));

    const result = await expireStaleOffers();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("DB connection lost");
    }
  });
});
