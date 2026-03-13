import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { createListing } from "@/features/market/services/listings";

const MOCK_CARD = { id: "card-1", name: "Charizard" };

describe("createListing with photos and shipping", () => {
  beforeEach(() => {
    mockPrisma.card.findUnique.mockReset();
    mockPrisma.listing.create.mockReset();
    mockPrisma.card.findUnique.mockResolvedValue(MOCK_CARD);
    mockPrisma.listing.create.mockResolvedValue({ id: "listing-1" });
  });

  it("creates listing with photos array", async () => {
    const photos = ["https://blob.vercel.com/a.jpg", "https://blob.vercel.com/b.jpg"];

    const result = await createListing("user-1", "card-1", 25, "Mint", 1, false, undefined, "EUR", "EN", photos);

    expect(result.success).toBe(true);
    expect(mockPrisma.listing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ photos }),
      select: { id: true },
    });
  });

  it("creates listing with EUR currency", async () => {
    const result = await createListing("user-1", "card-1", 25, "Mint", 1, false, undefined, "EUR");

    expect(result.success).toBe(true);
    expect(mockPrisma.listing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ currency: "EUR" }),
      select: { id: true },
    });
  });

  it("creates listing with USD currency", async () => {
    const result = await createListing("user-1", "card-1", 25, "Mint", 1, false, undefined, "USD");

    expect(result.success).toBe(true);
    expect(mockPrisma.listing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ currency: "USD" }),
      select: { id: true },
    });
  });

  it("creates listing with shipping zones", async () => {
    const zones = [
      { zone: "DOMESTIC", price: 3, currency: "EUR", estimatedMin: 2, estimatedMax: 5 },
      { zone: "EU", price: 8, currency: "EUR", estimatedMin: 5, estimatedMax: 10 },
    ];

    const result = await createListing("user-1", "card-1", 25, "Mint", 1, false, undefined, "EUR", "EN", [], zones);

    expect(result.success).toBe(true);
    expect(mockPrisma.listing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shippingZones: { create: zones },
      }),
      select: { id: true },
    });
  });

  it("creates listing without shipping zones (optional)", async () => {
    const result = await createListing("user-1", "card-1", 25, "Mint", 1, false);

    expect(result.success).toBe(true);
    const callData = mockPrisma.listing.create.mock.calls[0][0].data;
    expect(callData.shippingZones).toBeUndefined();
  });

  it("creates listing with language", async () => {
    const result = await createListing("user-1", "card-1", 25, "Mint", 1, false, undefined, "EUR", "JP");

    expect(result.success).toBe(true);
    expect(mockPrisma.listing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ language: "JP" }),
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

  it("defaults to empty photos and EUR currency", async () => {
    const result = await createListing("user-1", "card-1", 25, "Mint", 1, false);

    expect(result.success).toBe(true);
    expect(mockPrisma.listing.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ photos: [], currency: "EUR", language: "EN" }),
      select: { id: true },
    });
  });
});
