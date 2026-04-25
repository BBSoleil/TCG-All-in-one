import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { counterOffer } from "@/features/market/services/offers";

describe("counterOffer", () => {
  beforeEach(() => {
    Object.values(mockPrisma).forEach((model) => {
      if (typeof model === "object" && model !== null) {
        Object.values(model).forEach((fn) => {
          if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
        });
      }
    });
  });

  it("counters a pending offer and creates a new one", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      listingId: "listing-1",
      buyerId: "buyer-1",
      price: 10,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 86400000),
      listing: { userId: "seller-1" },
    });
    mockPrisma.$transaction.mockResolvedValue([
      { id: "offer-1", status: "COUNTERED" },
      { id: "counter-offer-1" },
    ]);

    const result = await counterOffer("offer-1", "seller-1", 15, "How about 15?");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("counter-offer-1");
    }
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });

  it("rejects if offer is not pending", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "DECLINED",
      listing: { userId: "seller-1" },
    });

    const result = await counterOffer("offer-1", "seller-1", 15);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("not pending");
    }
  });

  it("rejects if user is not the seller", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 86400000),
      listing: { userId: "seller-1" },
    });

    const result = await counterOffer("offer-1", "other-user", 15);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("Not authorized");
    }
  });

  it("rejects if offer has expired", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "PENDING",
      expiresAt: new Date(Date.now() - 1000),
      listing: { userId: "seller-1" },
    });
    mockPrisma.offer.update.mockResolvedValue({ id: "offer-1" });

    const result = await counterOffer("offer-1", "seller-1", 15);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("expired");
    }
  });

  it("rejects if offer not found", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue(null);

    const result = await counterOffer("nonexistent", "seller-1", 15);
    expect(result.success).toBe(false);
  });
});
