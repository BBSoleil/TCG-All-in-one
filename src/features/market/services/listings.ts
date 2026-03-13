import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { ListingItem } from "../types";
import { getSellerRating, mapListing, CARD_SELECT } from "./listing-helpers";

// Re-export browse module so existing imports continue to work
export { browseListings, getUserListingsByStatus } from "./browse";
export type { BrowseListingsFilters, BrowseListingsResult } from "./browse";

export async function createListing(
  userId: string,
  cardId: string,
  price: number,
  condition: string,
  quantity: number,
  isTradeOnly: boolean,
  description?: string,
  currency = "EUR",
  language = "EN",
  photos: string[] = [],
  shippingZones?: { zone: string; price: number; currency: string; estimatedMin: number; estimatedMax: number }[],
): Promise<Result<{ id: string }>> {
  try {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return { success: false, error: new Error("Card not found") };

    const listing = await prisma.listing.create({
      data: {
        userId,
        cardId,
        price,
        condition,
        quantity,
        isTradeOnly,
        description: description || null,
        currency,
        language,
        photos,
        ...(shippingZones?.length ? {
          shippingZones: {
            create: shippingZones,
          },
        } : {}),
      },
      select: { id: true },
    });

    console.log(`[listing] Created listing ${listing.id} with ${photos.length} photos, ${shippingZones?.length ?? 0} shipping zones`);
    return { success: true, data: listing };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to create listing") };
  }
}

export async function getUserListings(
  userId: string,
): Promise<Result<ListingItem[]>> {
  try {
    const listings = await prisma.listing.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        card: { select: CARD_SELECT },
        shippingZones: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const avgRating = await getSellerRating(userId);
    return {
      success: true,
      data: listings.map((l) => mapListing(l, avgRating)),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch listings") };
  }
}

export async function getListingById(
  id: string,
): Promise<Result<ListingItem>> {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        card: { select: CARD_SELECT },
        shippingZones: true,
      },
    });
    if (!listing) return { success: false, error: new Error("Listing not found") };
    const avgRating = await getSellerRating(listing.userId);
    return { success: true, data: mapListing(listing, avgRating) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch listing") };
  }
}

export async function updateListingPrice(
  id: string,
  userId: string,
  newPrice: number,
): Promise<Result<void>> {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id, userId, status: "ACTIVE" },
    });
    if (!listing) return { success: false, error: new Error("Listing not found") };

    await prisma.listing.update({
      where: { id },
      data: { price: newPrice },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update price") };
  }
}

export async function cancelListing(
  id: string,
  userId: string,
): Promise<Result<void>> {
  try {
    const listing = await prisma.listing.findFirst({ where: { id, userId, status: "ACTIVE" } });
    if (!listing) return { success: false, error: new Error("Listing not found") };

    await prisma.listing.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    // Decline all pending offers
    await prisma.offer.updateMany({
      where: { listingId: id, status: "PENDING" },
      data: { status: "DECLINED" },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to cancel listing") };
  }
}
