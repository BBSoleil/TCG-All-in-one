import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import {
  makeOffer,
  acceptOffer,
  declineOffer,
  withdrawOffer,
  getUserTransactions,
} from "@/features/market/services/offers";

describe("makeOffer", () => {
  beforeEach(() => {
    mockPrisma.listing.findUnique.mockReset();
    mockPrisma.offer.create.mockReset();
  });

  it("creates offer on active listing", async () => {
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing-1",
      status: "ACTIVE",
      userId: "seller-1",
    });
    mockPrisma.offer.create.mockResolvedValue({ id: "offer-1" });

    const result = await makeOffer("listing-1", "buyer-1", 20, "Interested!");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("offer-1");
    }
    expect(mockPrisma.offer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        listingId: "listing-1",
        buyerId: "buyer-1",
        price: 20,
        message: "Interested!",
        expiresAt: expect.any(Date),
      }),
      select: { id: true },
    });
  });

  it("rejects offer on inactive listing", async () => {
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing-1",
      status: "SOLD",
      userId: "seller-1",
    });

    const result = await makeOffer("listing-1", "buyer-1", 20);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Listing not available");
    }
  });

  it("rejects self-offer", async () => {
    mockPrisma.listing.findUnique.mockResolvedValue({
      id: "listing-1",
      status: "ACTIVE",
      userId: "user-1",
    });

    const result = await makeOffer("listing-1", "user-1", 20);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Cannot make offer on your own listing");
    }
  });

  it("rejects offer on nonexistent listing", async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    const result = await makeOffer("fake-listing", "buyer-1", 20);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Listing not available");
    }
  });
});

describe("acceptOffer", () => {
  beforeEach(() => {
    mockPrisma.offer.findUnique.mockReset();
    mockPrisma.$transaction.mockReset();
  });

  it("accepts offer with atomic transaction", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "PENDING",
      buyerId: "buyer-1",
      price: 20,
      listingId: "listing-1",
      listing: { userId: "seller-1" },
    });
    // Mock $transaction to return array with first element being the created transaction
    mockPrisma.$transaction.mockResolvedValue([{ id: "tx-1" }]);

    const result = await acceptOffer("offer-1", "seller-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.transactionId).toBe("tx-1");
    }
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("rejects when offer not pending", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "DECLINED",
      listing: { userId: "seller-1" },
    });

    const result = await acceptOffer("offer-1", "seller-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Offer not found");
    }
  });

  it("rejects when wrong seller", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "PENDING",
      listing: { userId: "seller-1" },
    });

    const result = await acceptOffer("offer-1", "wrong-seller");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Not authorized");
    }
  });
});

describe("declineOffer", () => {
  beforeEach(() => {
    mockPrisma.offer.findUnique.mockReset();
    mockPrisma.offer.update.mockReset();
  });

  it("declines a pending offer as seller", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "PENDING",
      listing: { userId: "seller-1" },
    });
    mockPrisma.offer.update.mockResolvedValue({ id: "offer-1" });

    const result = await declineOffer("offer-1", "seller-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.offer.update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: { status: "DECLINED" },
    });
  });

  it("rejects decline from non-seller", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "PENDING",
      listing: { userId: "seller-1" },
    });

    const result = await declineOffer("offer-1", "wrong-user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Not authorized");
    }
  });
});

describe("withdrawOffer", () => {
  beforeEach(() => {
    mockPrisma.offer.findUnique.mockReset();
    mockPrisma.offer.update.mockReset();
  });

  it("withdraws own pending offer", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "PENDING",
      buyerId: "buyer-1",
    });
    mockPrisma.offer.update.mockResolvedValue({ id: "offer-1" });

    const result = await withdrawOffer("offer-1", "buyer-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.offer.update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: { status: "WITHDRAWN" },
    });
  });

  it("rejects withdrawal from non-buyer", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "PENDING",
      buyerId: "buyer-1",
    });

    const result = await withdrawOffer("offer-1", "wrong-user");

    expect(result.success).toBe(false);
  });

  it("rejects withdrawal of non-pending offer", async () => {
    mockPrisma.offer.findUnique.mockResolvedValue({
      id: "offer-1",
      status: "ACCEPTED",
      buyerId: "buyer-1",
    });

    const result = await withdrawOffer("offer-1", "buyer-1");

    expect(result.success).toBe(false);
  });
});

describe("getUserTransactions", () => {
  beforeEach(() => {
    mockPrisma.transaction.findMany.mockReset();
  });

  it("returns mapped transactions", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([
      {
        id: "tx-1",
        price: 20,
        completedAt: new Date("2026-01-01"),
        listing: { card: { id: "card-1", name: "Charizard", imageUrl: null } },
        seller: { id: "seller-1", name: "Ash" },
        buyer: { id: "buyer-1", name: "Gary" },
        ratings: [{ raterId: "buyer-1", score: 5 }],
      },
    ]);

    const result = await getUserTransactions("seller-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.price).toBe(20);
      expect(result.data[0]?.seller.name).toBe("Ash");
    }
  });

  it("returns empty array for user with no transactions", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([]);

    const result = await getUserTransactions("no-tx-user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });
});
