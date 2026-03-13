import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { addCardToCollection } from "@/features/collection/services/collection-cards";

const MOCK_CARD = { id: "card-1", name: "Charizard" };

describe("addCardToCollection with variants", () => {
  beforeEach(() => {
    mockPrisma.collection.findFirst.mockReset();
    mockPrisma.card.findUnique.mockReset();
    mockPrisma.collectionCard.findFirst.mockReset();
    mockPrisma.collectionCard.create.mockReset();
    mockPrisma.collectionCard.update.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.$queryRawUnsafe.mockReset();
    // Default: master user (skip freemium)
    mockPrisma.user.findUnique.mockResolvedValue({ subscriptionTier: "master" });
    mockPrisma.collection.findFirst.mockResolvedValue({ id: "col-1" });
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);
    mockPrisma.collectionCard.findFirst.mockResolvedValue(null);
  });

  it("creates card with default language EN and foil false", async () => {
    mockPrisma.collectionCard.create.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 1);

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ language: "EN", foil: false }),
      select: { id: true },
    });
  });

  it("creates card with specific language FR", async () => {
    mockPrisma.collectionCard.create.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 1, "Mint", undefined, "FR");

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ language: "FR" }),
      select: { id: true },
    });
  });

  it("creates card with foil=true", async () => {
    mockPrisma.collectionCard.create.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 1, "Near Mint", undefined, "EN", true);

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ foil: true }),
      select: { id: true },
    });
  });

  it("queries for exact variant match (language + foil + condition)", async () => {
    mockPrisma.collectionCard.create.mockResolvedValue({ id: "cc-1" });

    await addCardToCollection("col-1", "user-1", "card-1", 1, "Mint", undefined, "JP", true);

    expect(mockPrisma.collectionCard.findFirst).toHaveBeenCalledWith({
      where: { collectionId: "col-1", cardId: "card-1", language: "JP", foil: true, condition: "Mint" },
      select: { id: true, quantity: true },
    });
  });

  it("updates quantity when exact variant exists", async () => {
    mockPrisma.collectionCard.findFirst.mockResolvedValue({ id: "cc-1", quantity: 2 });
    mockPrisma.collectionCard.update.mockResolvedValue({ id: "cc-1" });

    const result = await addCardToCollection("col-1", "user-1", "card-1", 5, "Near Mint", "note", "EN", false);

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { quantity: 5, notes: "note" },
      select: { id: true },
    });
    expect(mockPrisma.collectionCard.create).not.toHaveBeenCalled();
  });

  it("defaults condition to Near Mint when not provided", async () => {
    mockPrisma.collectionCard.create.mockResolvedValue({ id: "cc-1" });

    await addCardToCollection("col-1", "user-1", "card-1", 1);

    expect(mockPrisma.collectionCard.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ condition: "Near Mint" }),
      select: { id: true, quantity: true },
    });
    expect(mockPrisma.collectionCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ condition: "Near Mint" }),
      select: { id: true },
    });
  });

  it("returns error when collection not found", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);

    const result = await addCardToCollection("bad-col", "user-1", "card-1", 1);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe("Collection not found");
  });

  it("returns error when card not found", async () => {
    mockPrisma.card.findUnique.mockResolvedValue(null);

    const result = await addCardToCollection("col-1", "user-1", "bad-card", 1);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe("Card not found");
  });
});
