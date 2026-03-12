import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import {
  getCollectionCards,
  getAllCollectionCards,
  addCardToCollection,
  updateCollectionCard,
  removeCardFromCollection,
  matchAndImportCards,
  getUserTotalCardCount,
} from "@/features/collection/services/collection-cards";

const MOCK_CARD = {
  id: "card-1",
  name: "Charizard",
  gameType: "POKEMON",
  setName: "Base Set",
  rarity: "Rare",
  imageUrl: "https://example.com/charizard.jpg",
  marketPrice: 50,
};

function mockCollectionCard(overrides: Record<string, unknown> = {}) {
  return {
    id: "cc-1",
    collectionId: "col-1",
    cardId: "card-1",
    quantity: 1,
    condition: "Near Mint",
    notes: null,
    addedAt: new Date("2026-01-01"),
    card: MOCK_CARD,
    ...overrides,
  };
}

describe("getCollectionCards", () => {
  beforeEach(() => {
    mockPrisma.collectionCard.findMany.mockReset();
    mockPrisma.collectionCard.count.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
  });

  it("returns paginated cards with collection value", async () => {
    mockPrisma.collectionCard.findMany.mockResolvedValue([mockCollectionCard()]);
    mockPrisma.collectionCard.count.mockResolvedValue(1);
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ value: 50 }]);

    const result = await getCollectionCards("col-1", "user-1", 1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cards).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.totalPages).toBe(1);
      expect(result.data.collectionValue).toBe(50);
    }
  });

  it("calculates totalPages correctly", async () => {
    mockPrisma.collectionCard.findMany.mockResolvedValue([]);
    mockPrisma.collectionCard.count.mockResolvedValue(50);
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ value: 0 }]);

    const result = await getCollectionCards("col-1", "user-1", 1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalPages).toBe(3); // ceil(50/24)
    }
  });

  it("handles missing value rows (defaults to 0)", async () => {
    mockPrisma.collectionCard.findMany.mockResolvedValue([]);
    mockPrisma.collectionCard.count.mockResolvedValue(0);
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await getCollectionCards("col-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionValue).toBe(0);
    }
  });

  it("returns error on DB failure", async () => {
    mockPrisma.collectionCard.findMany.mockRejectedValue(new Error("DB error"));

    const result = await getCollectionCards("col-1", "user-1");

    expect(result.success).toBe(false);
  });
});

describe("getAllCollectionCards", () => {
  beforeEach(() => {
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.collectionCard.findMany.mockReset();
  });

  it("returns all cards for owned collection", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.collectionCard.findMany.mockResolvedValue([mockCollectionCard()]);

    const result = await getAllCollectionCards("col-1", "user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }
  });

  it("returns error when collection not found", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);

    const result = await getAllCollectionCards("bad-col", "user-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Collection not found");
    }
  });

  it("checks userId ownership", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);

    await getAllCollectionCards("col-1", "wrong-user");

    expect(mockPrisma.collection.findFirst).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "wrong-user" },
      select: { id: true },
    });
  });
});

describe("addCardToCollection", () => {
  beforeEach(() => {
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.card.findUnique.mockReset();
    mockPrisma.collectionCard.findUnique.mockReset();
    mockPrisma.collectionCard.upsert.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
    // Default: free user with 0 cards (under limit)
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "free" });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 0 }]);
    mockPrisma.collectionCard.findUnique.mockResolvedValue(null); // no existing card
  });

  it("upserts card into collection", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 2, "Near Mint", "my note");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("cc-1");
    }
    expect(mockPrisma.collectionCard.upsert).toHaveBeenCalledWith({
      where: { collectionId_cardId: { collectionId: "col-1", cardId: "card-1" } },
      create: { collectionId: "col-1", cardId: "card-1", quantity: 2, condition: "Near Mint", notes: "my note" },
      update: { quantity: 2, condition: "Near Mint", notes: "my note" },
      select: { id: true },
    });
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

describe("updateCollectionCard", () => {
  beforeEach(() => {
    mockPrisma.collectionCard.findUnique.mockReset();
    mockPrisma.collectionCard.update.mockReset();
  });

  it("updates quantity and condition for owned card", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue({
      id: "cc-1",
      collection: { userId: "user-1" },
    });
    mockPrisma.collectionCard.update.mockResolvedValue({ id: "cc-1" });

    const result = await updateCollectionCard("cc-1", "user-1", 3, "Mint", "updated");

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { quantity: 3, condition: "Mint", notes: "updated" },
      select: { id: true },
    });
  });

  it("returns error when card not found", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue(null);

    const result = await updateCollectionCard("bad-id", "user-1", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Card not found in collection");
    }
  });

  it("returns error when wrong user", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue({
      id: "cc-1",
      collection: { userId: "other-user" },
    });

    const result = await updateCollectionCard("cc-1", "user-1", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Card not found in collection");
    }
  });
});

describe("removeCardFromCollection", () => {
  beforeEach(() => {
    mockPrisma.collectionCard.findUnique.mockReset();
    mockPrisma.collectionCard.delete.mockReset();
  });

  it("deletes card owned by user", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue({
      id: "cc-1",
      collection: { userId: "user-1" },
    });
    mockPrisma.collectionCard.delete.mockResolvedValue({ id: "cc-1" });

    const result = await removeCardFromCollection("cc-1", "user-1");

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.delete).toHaveBeenCalledWith({ where: { id: "cc-1" } });
  });

  it("returns error for wrong user", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue({
      id: "cc-1",
      collection: { userId: "other-user" },
    });

    const result = await removeCardFromCollection("cc-1", "user-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Card not found in collection");
    }
    expect(mockPrisma.collectionCard.delete).not.toHaveBeenCalled();
  });

  it("returns error when card not found", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue(null);

    const result = await removeCardFromCollection("nonexistent", "user-1");

    expect(result.success).toBe(false);
  });
});

describe("matchAndImportCards", () => {
  beforeEach(() => {
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.card.findMany.mockReset();
    mockPrisma.collectionCard.upsert.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
    // Default: free user under limit
    mockPrisma.collection.findFirst.mockResolvedValue({ userId: "user-1" });
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "free" });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 0 }]);
  });

  it("imports matched cards with case-insensitive lookup", async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: "card-1", name: "Charizard" },
      { id: "card-2", name: "Pikachu" },
    ]);
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    const rows = [
      { name: "charizard", quantity: 2, condition: "Near Mint", notes: null },
      { name: "PIKACHU", quantity: 1, condition: null, notes: "foil" },
    ];

    const result = await matchAndImportCards("col-1", "POKEMON", rows);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imported).toBe(2);
      expect(result.data.total).toBe(2);
      expect(result.data.errors).toHaveLength(0);
    }
    expect(mockPrisma.collectionCard.upsert).toHaveBeenCalledTimes(2);
  });

  it("reports unmatched cards as errors", async () => {
    mockPrisma.card.findMany.mockResolvedValue([
      { id: "card-1", name: "Charizard" },
    ]);
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    const rows = [
      { name: "Charizard", quantity: 1, condition: null, notes: null },
      { name: "Blastoise", quantity: 1, condition: null, notes: null },
    ];

    const result = await matchAndImportCards("col-1", "POKEMON", rows);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imported).toBe(1);
      expect(result.data.total).toBe(2);
      expect(result.data.errors).toContain('Card not found: "Blastoise"');
    }
  });

  it("includes parse errors in output", async () => {
    mockPrisma.card.findMany.mockResolvedValue([]);

    const result = await matchAndImportCards("col-1", "POKEMON", [], ["Row 1: invalid format"]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imported).toBe(0);
      expect(result.data.errors).toContain("Row 1: invalid format");
    }
  });

  it("deduplicates card names in lookup query", async () => {
    mockPrisma.card.findMany.mockResolvedValue([{ id: "card-1", name: "Charizard" }]);
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    const rows = [
      { name: "Charizard", quantity: 1, condition: null, notes: null },
      { name: "Charizard", quantity: 2, condition: null, notes: null },
    ];

    await matchAndImportCards("col-1", "POKEMON", rows);

    // findMany should receive deduplicated names
    const findManyCall = mockPrisma.card.findMany.mock.calls[0]?.[0];
    expect(findManyCall?.where?.name?.in).toHaveLength(1);
  });

  it("returns error on DB failure", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({ userId: "user-1" });
    mockPrisma.card.findMany.mockRejectedValue(new Error("DB error"));

    const result = await matchAndImportCards("col-1", "POKEMON", [
      { name: "Charizard", quantity: 1, condition: null, notes: null },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects import when batch exceeds free-tier limit", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 1990 }]);

    const rows = Array.from({ length: 15 }, (_, i) => ({
      name: `Card${i}`,
      quantity: 1,
      condition: null,
      notes: null,
    }));

    const result = await matchAndImportCards("col-1", "POKEMON", rows);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("UPGRADE_REQUIRED:");
    }
  });

  it("allows import for master-tier users regardless of count", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "master" });
    mockPrisma.card.findMany.mockResolvedValue([{ id: "card-1", name: "Charizard" }]);
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    const rows = [{ name: "Charizard", quantity: 1, condition: null, notes: null }];
    const result = await matchAndImportCards("col-1", "POKEMON", rows);

    expect(result.success).toBe(true);
  });
});

describe("freemium gate", () => {
  beforeEach(() => {
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.card.findUnique.mockReset();
    mockPrisma.collectionCard.findUnique.mockReset();
    mockPrisma.collectionCard.upsert.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
  });

  it("allows adding card at 1999 (just under limit)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "free" });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 1999 }]);
    mockPrisma.collectionCard.findUnique.mockResolvedValue(null);
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 1);

    expect(result.success).toBe(true);
  });

  it("blocks adding card at 2000 (at limit)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "free" });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 2000 }]);
    mockPrisma.collectionCard.findUnique.mockResolvedValue(null);
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);

    const result = await addCardToCollection("col-1", "user-1", "card-1", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("UPGRADE_REQUIRED:");
      expect(result.error.message).toMatch(/2.?000/); // locale-agnostic
      expect(result.error.message).toContain("0 more");
    }
    expect(mockPrisma.collectionCard.upsert).not.toHaveBeenCalled();
  });

  it("blocks when quantity would exceed limit", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "free" });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 1995 }]);
    mockPrisma.collectionCard.findUnique.mockResolvedValue(null);
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);

    const result = await addCardToCollection("col-1", "user-1", "card-1", 10);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("UPGRADE_REQUIRED:");
      expect(result.error.message).toContain("5 more");
    }
  });

  it("allows master-tier users to exceed limit", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "master" });
    mockPrisma.collectionCard.findUnique.mockResolvedValue(null);
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 1);

    expect(result.success).toBe(true);
    // $queryRawUnsafe should NOT be called for master users (count query skipped)
    expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it("accounts for existing quantity when updating a card", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "free" });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 1998 }]);
    // Card already exists with quantity 2
    mockPrisma.collectionCard.findUnique.mockResolvedValue({ quantity: 2 });
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);
    mockPrisma.collectionCard.upsert.mockResolvedValue({ id: "cc-1" });

    // Updating from 2 to 4: net increase of 2, total would be 2000 — should pass
    const result = await addCardToCollection("col-1", "user-1", "card-1", 4);

    expect(result.success).toBe(true);
  });

  it("returns correct card count via getUserTotalCardCount", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ total: 1234 }]);

    const count = await getUserTotalCardCount("user-1");

    expect(count).toBe(1234);
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining("SUM(cc.quantity)"),
      "user-1",
    );
  });
});
