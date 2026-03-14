import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { updateCollectionCardFlags } from "@/features/collection/services/collection-cards";

describe("updateCollectionCardFlags", () => {
  beforeEach(() => {
    mockPrisma.collectionCard.findUnique.mockReset();
    mockPrisma.collectionCard.update.mockReset();
  });

  it("toggles forSale to true", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue({
      id: "cc-1",
      collection: { userId: "user-1" },
    });
    mockPrisma.collectionCard.update.mockResolvedValue({ id: "cc-1" });

    const result = await updateCollectionCardFlags("cc-1", "user-1", { forSale: true });

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { forSale: true },
      select: { id: true },
    });
  });

  it("toggles forTrade to true", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue({
      id: "cc-1",
      collection: { userId: "user-1" },
    });
    mockPrisma.collectionCard.update.mockResolvedValue({ id: "cc-1" });

    const result = await updateCollectionCardFlags("cc-1", "user-1", { forTrade: true });

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { forTrade: true },
      select: { id: true },
    });
  });

  it("toggles both flags at once", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue({
      id: "cc-1",
      collection: { userId: "user-1" },
    });
    mockPrisma.collectionCard.update.mockResolvedValue({ id: "cc-1" });

    const result = await updateCollectionCardFlags("cc-1", "user-1", {
      forSale: true,
      forTrade: false,
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.collectionCard.update).toHaveBeenCalledWith({
      where: { id: "cc-1" },
      data: { forSale: true, forTrade: false },
      select: { id: true },
    });
  });

  it("returns error when card not found", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue(null);

    const result = await updateCollectionCardFlags("bad-id", "user-1", { forSale: true });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Card not found in collection");
    }
  });

  it("returns error when user does not own the collection", async () => {
    mockPrisma.collectionCard.findUnique.mockResolvedValue({
      id: "cc-1",
      collection: { userId: "other-user" },
    });

    const result = await updateCollectionCardFlags("cc-1", "user-1", { forSale: true });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Card not found in collection");
    }
  });

  it("handles database errors gracefully", async () => {
    mockPrisma.collectionCard.findUnique.mockRejectedValue(new Error("DB timeout"));

    const result = await updateCollectionCardFlags("cc-1", "user-1", { forSale: true });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("DB timeout");
    }
  });
});
