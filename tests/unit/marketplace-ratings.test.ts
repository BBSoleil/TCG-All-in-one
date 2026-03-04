import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import {
  rateTransaction,
  getUserRating,
  getWishlistMatches,
} from "@/features/market/services/ratings";

describe("rateTransaction", () => {
  beforeEach(() => {
    mockPrisma.transaction.findUnique.mockReset();
    mockPrisma.userRating.upsert.mockReset();
  });

  it("rates transaction as seller (rates buyer)", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: "tx-1",
      sellerId: "seller-1",
      buyerId: "buyer-1",
    });
    mockPrisma.userRating.upsert.mockResolvedValue({ id: "rating-1" });

    const result = await rateTransaction("tx-1", "seller-1", 5, "Great buyer!");

    expect(result.success).toBe(true);
    expect(mockPrisma.userRating.upsert).toHaveBeenCalledWith({
      where: { transactionId_raterId: { transactionId: "tx-1", raterId: "seller-1" } },
      create: {
        transactionId: "tx-1",
        raterId: "seller-1",
        rateeId: "buyer-1",
        score: 5,
        comment: "Great buyer!",
      },
      update: { score: 5, comment: "Great buyer!" },
    });
  });

  it("rates transaction as buyer (rates seller)", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: "tx-1",
      sellerId: "seller-1",
      buyerId: "buyer-1",
    });
    mockPrisma.userRating.upsert.mockResolvedValue({ id: "rating-1" });

    const result = await rateTransaction("tx-1", "buyer-1", 4);

    expect(result.success).toBe(true);
    expect(mockPrisma.userRating.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ rateeId: "seller-1", score: 4 }),
      }),
    );
  });

  it("rejects score below 1", async () => {
    const result = await rateTransaction("tx-1", "user-1", 0);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Score must be between 1 and 5");
    }
  });

  it("rejects score above 5", async () => {
    const result = await rateTransaction("tx-1", "user-1", 6);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Score must be between 1 and 5");
    }
  });

  it("rejects when transaction not found", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);

    const result = await rateTransaction("fake-tx", "user-1", 3);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Transaction not found");
    }
  });

  it("rejects when user not part of transaction", async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      id: "tx-1",
      sellerId: "seller-1",
      buyerId: "buyer-1",
    });

    const result = await rateTransaction("tx-1", "outsider", 3);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Not part of this transaction");
    }
  });
});

describe("getUserRating", () => {
  beforeEach(() => {
    mockPrisma.userRating.aggregate.mockReset();
  });

  it("returns average and count", async () => {
    mockPrisma.userRating.aggregate.mockResolvedValue({
      _avg: { score: 4.2 },
      _count: { score: 10 },
    });

    const result = await getUserRating("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avgRating).toBe(4.2);
      expect(result.data.totalRatings).toBe(10);
    }
  });

  it("returns null avg for user with no ratings", async () => {
    mockPrisma.userRating.aggregate.mockResolvedValue({
      _avg: { score: null },
      _count: { score: 0 },
    });

    const result = await getUserRating("new-user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avgRating).toBeNull();
      expect(result.data.totalRatings).toBe(0);
    }
  });
});

describe("getWishlistMatches", () => {
  beforeEach(() => {
    mockPrisma.wishlistCard.findMany.mockReset();
    mockPrisma.listing.findMany.mockReset();
    mockPrisma.userRating.aggregate.mockReset();
  });

  it("returns empty for empty wishlist", async () => {
    mockPrisma.wishlistCard.findMany.mockResolvedValue([]);

    const result = await getWishlistMatches("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("matches active listings to wishlist cards", async () => {
    mockPrisma.wishlistCard.findMany.mockResolvedValue([
      { id: "wl-1", cardId: "card-1", targetPrice: 20 },
    ]);
    mockPrisma.listing.findMany.mockResolvedValue([
      {
        id: "listing-1",
        price: 15,
        condition: "Near Mint",
        description: null,
        quantity: 1,
        isTradeOnly: false,
        status: "ACTIVE",
        createdAt: new Date(),
        userId: "seller-1",
        cardId: "card-1",
        user: { id: "seller-1", name: "Seller", image: null },
        card: {
          id: "card-1",
          name: "Charizard",
          gameType: "POKEMON",
          setName: "Base Set",
          rarity: "Rare",
          imageUrl: null,
          marketPrice: 25,
        },
      },
    ]);
    mockPrisma.userRating.aggregate.mockResolvedValue({ _avg: { score: 4.0 } });

    const result = await getWishlistMatches("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.listing.price).toBe(15);
      expect(result.data[0]?.targetPrice).toBe(20);
      expect(result.data[0]?.wishlistCardId).toBe("wl-1");
    }
  });
});
