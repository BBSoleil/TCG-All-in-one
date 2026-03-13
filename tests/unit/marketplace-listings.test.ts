import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import {
  createListing,
  cancelListing,
  browseListings,
  getUserListingsByStatus,
  updateListingPrice,
} from "@/features/market/services/listings";

const MOCK_CARD = {
  id: "card-1",
  name: "Charizard",
  gameType: "POKEMON",
  setName: "Base Set",
  rarity: "Rare",
  imageUrl: "https://example.com/charizard.jpg",
  marketPrice: 50,
};

const MOCK_USER = { id: "user-1", name: "Ash", image: null };

function mockListing(overrides: Record<string, unknown> = {}) {
  return {
    id: "listing-1",
    price: 25,
    currency: "EUR",
    language: "EN",
    photos: [],
    condition: "Near Mint",
    description: null,
    quantity: 1,
    isTradeOnly: false,
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
    userId: "user-1",
    user: MOCK_USER,
    card: MOCK_CARD,
    shippingZones: [],
    ...overrides,
  };
}

describe("createListing", () => {
  beforeEach(() => {
    mockPrisma.card.findUnique.mockReset();
    mockPrisma.listing.create.mockReset();
  });

  it("creates a listing when card exists", async () => {
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);
    mockPrisma.listing.create.mockResolvedValue({ id: "new-listing" });

    const result = await createListing("user-1", "card-1", 25, "Near Mint", 1, false);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("new-listing");
    }
    expect(mockPrisma.listing.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        cardId: "card-1",
        price: 25,
        condition: "Near Mint",
        quantity: 1,
        isTradeOnly: false,
        description: null,
        currency: "EUR",
        language: "EN",
        photos: [],
      },
      select: { id: true },
    });
  });

  it("returns error when card not found", async () => {
    mockPrisma.card.findUnique.mockResolvedValue(null);

    const result = await createListing("user-1", "bad-card", 10, "Mint", 1, false);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Card not found");
    }
  });

  it("returns error on DB failure", async () => {
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);
    mockPrisma.listing.create.mockRejectedValue(new Error("DB error"));

    const result = await createListing("user-1", "card-1", 25, "Near Mint", 1, false);

    expect(result.success).toBe(false);
  });
});

describe("cancelListing", () => {
  beforeEach(() => {
    mockPrisma.listing.findFirst.mockReset();
    mockPrisma.listing.update.mockReset();
    mockPrisma.offer.updateMany.mockReset();
  });

  it("cancels listing and declines pending offers", async () => {
    mockPrisma.listing.findFirst.mockResolvedValue(mockListing());
    mockPrisma.listing.update.mockResolvedValue({ id: "listing-1" });
    mockPrisma.offer.updateMany.mockResolvedValue({ count: 2 });

    const result = await cancelListing("listing-1", "user-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.listing.update).toHaveBeenCalledWith({
      where: { id: "listing-1" },
      data: { status: "CANCELLED" },
    });
    expect(mockPrisma.offer.updateMany).toHaveBeenCalledWith({
      where: { listingId: "listing-1", status: "PENDING" },
      data: { status: "DECLINED" },
    });
  });

  it("returns error when listing not found", async () => {
    mockPrisma.listing.findFirst.mockResolvedValue(null);

    const result = await cancelListing("nonexistent", "user-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Listing not found");
    }
  });

  it("returns error when wrong user", async () => {
    // findFirst with userId filter returns null for wrong user
    mockPrisma.listing.findFirst.mockResolvedValue(null);

    const result = await cancelListing("listing-1", "wrong-user");

    expect(result.success).toBe(false);
  });
});

describe("browseListings", () => {
  beforeEach(() => {
    mockPrisma.listing.findMany.mockReset();
    mockPrisma.listing.count.mockReset();
    mockPrisma.userRating.aggregate.mockReset();
  });

  it("returns paginated listings with empty filters", async () => {
    mockPrisma.listing.findMany.mockResolvedValue([mockListing()]);
    mockPrisma.listing.count.mockResolvedValue(1);
    mockPrisma.userRating.aggregate.mockResolvedValue({ _avg: { score: 4.5 } });

    const result = await browseListings();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.listings).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.totalPages).toBe(1);
    }
  });

  it("returns empty when no active listings", async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    const result = await browseListings();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.listings).toHaveLength(0);
      expect(result.data.total).toBe(0);
    }
  });

  it("applies game type filter", async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await browseListings({ gameType: "POKEMON" });

    const call = mockPrisma.listing.findMany.mock.calls[0]?.[0];
    expect(call?.where?.card).toEqual({ gameType: "POKEMON" });
  });

  it("applies price range filter", async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await browseListings({ minPrice: 5, maxPrice: 50 });

    const call = mockPrisma.listing.findMany.mock.calls[0]?.[0];
    expect(call?.where?.price).toEqual({ gte: 5, lte: 50 });
  });
});

describe("getUserListingsByStatus", () => {
  beforeEach(() => {
    mockPrisma.listing.findMany.mockReset();
    mockPrisma.listing.count.mockReset();
    mockPrisma.transaction.aggregate.mockReset();
    mockPrisma.userRating.aggregate.mockReset();
  });

  it("returns listings with stats", async () => {
    mockPrisma.listing.findMany.mockResolvedValue([mockListing()]);
    mockPrisma.userRating.aggregate.mockResolvedValue({ _avg: { score: null } });
    mockPrisma.listing.count
      .mockResolvedValueOnce(2) // active
      .mockResolvedValueOnce(1) // sold
      .mockResolvedValueOnce(0); // cancelled
    mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { price: 100 } });

    const result = await getUserListingsByStatus("user-1", "ACTIVE");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.listings).toHaveLength(1);
      expect(result.data.stats.active).toBe(2);
      expect(result.data.stats.sold).toBe(1);
      expect(result.data.stats.cancelled).toBe(0);
      expect(result.data.stats.revenue).toBe(100);
    }
  });
});

describe("updateListingPrice", () => {
  beforeEach(() => {
    mockPrisma.listing.findFirst.mockReset();
    mockPrisma.listing.update.mockReset();
  });

  it("updates price for active listing owned by user", async () => {
    mockPrisma.listing.findFirst.mockResolvedValue(mockListing());
    mockPrisma.listing.update.mockResolvedValue({ id: "listing-1" });

    const result = await updateListingPrice("listing-1", "user-1", 30);

    expect(result.success).toBe(true);
    expect(mockPrisma.listing.update).toHaveBeenCalledWith({
      where: { id: "listing-1" },
      data: { price: 30 },
    });
  });

  it("returns error when listing not found or wrong user", async () => {
    mockPrisma.listing.findFirst.mockResolvedValue(null);

    const result = await updateListingPrice("listing-1", "wrong-user", 30);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Listing not found");
    }
  });
});
