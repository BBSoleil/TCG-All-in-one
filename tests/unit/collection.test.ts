import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import {
  getUserCollections,
  createCollection,
  deleteCollection,
  addCardToCollection,
  getDashboardStats,
} from "@/features/collection/services";

describe("getUserCollections", () => {
  beforeEach(() => {
    mockPrisma.collection.findMany.mockReset();
  });

  it("returns user collections with card counts", async () => {
    const mockCollections = [
      {
        id: "col-1",
        name: "My Pokemon",
        gameType: "POKEMON",
        isPublic: false,
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { cards: 15 },
      },
    ];
    mockPrisma.collection.findMany.mockResolvedValue(mockCollections);

    const result = await getUserCollections("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?._count.cards).toBe(15);
    }
  });

  it("returns empty array for user with no collections", async () => {
    mockPrisma.collection.findMany.mockResolvedValue([]);

    const result = await getUserCollections("user-no-collections");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });
});

describe("createCollection", () => {
  beforeEach(() => {
    mockPrisma.collection.create.mockReset();
  });

  it("creates a new collection", async () => {
    mockPrisma.collection.create.mockResolvedValue({ id: "new-col" });

    const result = await createCollection("user-1", "My YGO Deck", "YUGIOH");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("new-col");
    }
    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: { name: "My YGO Deck", gameType: "YUGIOH", userId: "user-1" },
      select: { id: true },
    });
  });

  it("returns error on duplicate or DB failure", async () => {
    mockPrisma.collection.create.mockRejectedValue(new Error("Unique constraint failed"));

    const result = await createCollection("user-1", "Dup", "POKEMON");

    expect(result.success).toBe(false);
  });
});

describe("deleteCollection", () => {
  beforeEach(() => {
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.collection.delete.mockReset();
  });

  it("deletes existing collection", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1", userId: "user-1" });
    mockPrisma.collection.delete.mockResolvedValue({ id: "col-1" });

    const result = await deleteCollection("col-1", "user-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.collection.delete).toHaveBeenCalledWith({ where: { id: "col-1" } });
  });

  it("returns error when collection not found", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);

    const result = await deleteCollection("nonexistent", "user-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Collection not found");
    }
  });
});

describe("addCardToCollection", () => {
  beforeEach(() => {
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.card.findUnique.mockReset();
    mockPrisma.collectionCard.upsert.mockReset();
  });

  it("adds a card to collection", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue({ id: "card-1" });
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 2, "Mint");

    expect(result.success).toBe(true);
  });

  it("returns error when collection not found", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);

    const result = await addCardToCollection("bad-col", "user-1", "card-1", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Collection not found");
    }
  });

  it("returns error when card not found", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue(null);

    const result = await addCardToCollection("col-1", "user-1", "bad-card", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Card not found");
    }
  });
});

describe("getDashboardStats", () => {
  beforeEach(() => {
    mockPrisma.$queryRawUnsafe.mockReset();
  });

  it("calculates portfolio stats correctly", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([
        { gameType: "POKEMON", count: 2 },
        { gameType: "MTG", count: 1 },
      ]) // game breakdown
      .mockResolvedValueOnce([
        { totalCollections: 3, totalCards: 18, portfolioValue: 45.5 },
      ]); // summary

    const result = await getDashboardStats("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCollections).toBe(3);
      expect(result.data.totalCards).toBe(18);
      expect(result.data.portfolioValue).toBe(45.5);
      expect(result.data.collectionsByGame).toHaveLength(2);
    }
  });

  it("returns zeros for user with no collections", async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // game breakdown
      .mockResolvedValueOnce([
        { totalCollections: 0, totalCards: 0, portfolioValue: 0 },
      ]); // summary

    const result = await getDashboardStats("empty-user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCollections).toBe(0);
      expect(result.data.totalCards).toBe(0);
      expect(result.data.portfolioValue).toBe(0);
    }
  });
});
