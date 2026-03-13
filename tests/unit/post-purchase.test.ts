import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";

// Mock next/cache to avoid import errors in server action context
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth for server action tests
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/auth";
import { addCardToCollection } from "@/features/collection/services/collection-cards";
import { getUserTransactions } from "@/features/market/services/offers";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("addCardToCollection (increment logic)", () => {
  beforeEach(() => {
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.card.findUnique.mockReset();
    mockPrisma.collectionCard.findFirst.mockReset();
    mockPrisma.collectionCard.create.mockReset();
    mockPrisma.collectionCard.update.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
    // Default: master user (skip freemium check)
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "master" });
  });

  it("adds card with quantity 1 when new", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({
      id: "col-1",
      userId: "user-1",
    });
    mockPrisma.card.findUnique.mockResolvedValue({
      id: "card-1",
      name: "Pikachu",
    });
    mockPrisma.collectionCard.findFirst.mockResolvedValue(null);
    mockPrisma.collectionCard.create.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 1);

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ quantity: 1, language: "EN", foil: false }),
      select: { id: true },
    });
  });

  it("updates quantity from 3 to 4 on repeat add", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({
      id: "col-1",
      userId: "user-1",
    });
    mockPrisma.card.findUnique.mockResolvedValue({
      id: "card-1",
      name: "Pikachu",
    });
    mockPrisma.collectionCard.findFirst.mockResolvedValue({ id: "cc-1", quantity: 3 });
    mockPrisma.collectionCard.update.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 4);

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: expect.objectContaining({ quantity: 4 }),
      select: { id: true },
    });
  });

  it("rejects when collection not owned by user", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);

    const result = await addCardToCollection("col-1", "user-1", "card-1", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("not found");
    }
  });

  it("rejects when card does not exist", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({
      id: "col-1",
      userId: "user-1",
    });
    mockPrisma.card.findUnique.mockResolvedValue(null);

    const result = await addCardToCollection("col-1", "user-1", "nonexistent", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("not found");
    }
  });
});

describe("addPurchasedCardToCollectionAction", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockPrisma.collectionCard.findFirst.mockReset();
    mockPrisma.collectionCard.create.mockReset();
    mockPrisma.collectionCard.update.mockReset();
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.card.findUnique.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
    // Default: master user (skip freemium check)
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "master" });
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    // Dynamic import to get the action after mocks are in place
    const { addPurchasedCardToCollectionAction } = await import(
      "@/features/market/actions/offer-actions"
    );

    const result = await addPurchasedCardToCollectionAction("col-1", "card-1");
    expect(result.error).toBe("Not authenticated");
  });

  it("returns error for empty collectionId", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const { addPurchasedCardToCollectionAction } = await import(
      "@/features/market/actions/offer-actions"
    );

    const result = await addPurchasedCardToCollectionAction("", "card-1");
    expect(result.error).toBeDefined();
  });

  it("increments existing card quantity", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    // findFirst is called twice: once by the action (to get existing qty), once by service (to find variant)
    // First call returns existing with qty 3, second call (from service) also finds it
    mockPrisma.collectionCard.findFirst.mockResolvedValue({ id: "cc-1", quantity: 3 });
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1", userId: "user-1" });
    mockPrisma.card.findUnique.mockResolvedValue({ id: "card-1", name: "Pikachu" });
    mockPrisma.collectionCard.update.mockResolvedValue({ id: "cc-1" });

    const { addPurchasedCardToCollectionAction } = await import(
      "@/features/market/actions/offer-actions"
    );

    const result = await addPurchasedCardToCollectionAction("col-1", "card-1");
    expect(result.error).toBeUndefined();

    // Should have called update with quantity 4 (3 + 1)
    expect(mockPrisma.collectionCard.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quantity: 4 }),
      }),
    );
  });

  it("sets quantity to 1 for new card", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.collectionCard.findFirst.mockResolvedValue(null);
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1", userId: "user-1" });
    mockPrisma.card.findUnique.mockResolvedValue({ id: "card-1", name: "Pikachu" });
    mockPrisma.collectionCard.create.mockResolvedValue({ id: "cc-1" });

    const { addPurchasedCardToCollectionAction } = await import(
      "@/features/market/actions/offer-actions"
    );

    const result = await addPurchasedCardToCollectionAction("col-1", "card-1");
    expect(result.error).toBeUndefined();

    expect(mockPrisma.collectionCard.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quantity: 1 }),
      }),
    );
  });
});

describe("getUserTransactions includes gameType", () => {
  beforeEach(() => {
    mockPrisma.transaction.findMany.mockReset();
  });

  it("returns gameType in transaction card data", async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([
      {
        id: "tx-1",
        price: 25,
        completedAt: new Date("2024-01-15"),
        listing: { card: { id: "card-1", name: "Charizard", imageUrl: null, gameType: "POKEMON" } },
        seller: { id: "seller-1", name: "Alice" },
        buyer: { id: "buyer-1", name: "Bob" },
        ratings: [],
      },
    ]);

    const result = await getUserTransactions("buyer-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].listing.card.gameType).toBe("POKEMON");
    }
  });
});
