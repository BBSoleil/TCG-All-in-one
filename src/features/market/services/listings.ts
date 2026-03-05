import { prisma } from "@/shared/lib/prisma";
import type { ListingStatus as PrismaListingStatus, GameType as PrismaGameType } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";
import type { ListingItem } from "../types";

const CARD_SELECT = {
  id: true,
  name: true,
  gameType: true,
  setName: true,
  rarity: true,
  imageUrl: true,
  marketPrice: true,
} as const;

async function getSellerRating(userId: string): Promise<number | null> {
  const result = await prisma.userRating.aggregate({
    where: { rateeId: userId },
    _avg: { score: true },
  });
  return result._avg.score;
}

function mapListing(
  listing: {
    id: string;
    price: unknown;
    condition: string;
    description: string | null;
    quantity: number;
    isTradeOnly: boolean;
    status: string;
    createdAt: Date;
    user: { id: string; name: string | null; image: string | null };
    card: { id: string; name: string; gameType: string; setName: string | null; rarity: string | null; imageUrl: string | null; marketPrice: unknown };
  },
  avgRating: number | null,
): ListingItem {
  return {
    id: listing.id,
    price: Number(listing.price),
    condition: listing.condition,
    description: listing.description,
    quantity: listing.quantity,
    isTradeOnly: listing.isTradeOnly,
    status: listing.status,
    createdAt: listing.createdAt,
    seller: { ...listing.user, avgRating },
    card: listing.card,
  };
}

export async function createListing(
  userId: string,
  cardId: string,
  price: number,
  condition: string,
  quantity: number,
  isTradeOnly: boolean,
  description?: string,
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
      },
      select: { id: true },
    });
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
      },
    });
    if (!listing) return { success: false, error: new Error("Listing not found") };
    const avgRating = await getSellerRating(listing.userId);
    return { success: true, data: mapListing(listing, avgRating) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch listing") };
  }
}

export interface BrowseListingsFilters {
  gameType?: string;
  search?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  cardId?: string;
  setName?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface BrowseListingsResult {
  listings: ListingItem[];
  total: number;
  page: number;
  totalPages: number;
}

export async function browseListings(
  filters?: BrowseListingsFilters,
): Promise<Result<BrowseListingsResult>> {
  try {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 24;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { status: "ACTIVE" as PrismaListingStatus };

    if (filters?.cardId) {
      where.cardId = filters.cardId;
    }
    if (filters?.gameType) {
      where.card = { gameType: filters.gameType as PrismaGameType };
    }
    if (filters?.search) {
      where.card = {
        ...(where.card as Record<string, unknown> | undefined),
        name: { contains: filters.search, mode: "insensitive" },
      };
    }
    if (filters?.setName) {
      where.card = {
        ...(where.card as Record<string, unknown> | undefined),
        setName: filters.setName,
      };
    }
    if (filters?.condition) {
      where.condition = filters.condition;
    }
    if (filters?.minPrice || filters?.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (filters.minPrice) priceFilter.gte = filters.minPrice;
      if (filters.maxPrice) priceFilter.lte = filters.maxPrice;
      where.price = priceFilter;
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (filters?.sort === "price_asc") orderBy = { price: "asc" };
    else if (filters?.sort === "price_desc") orderBy = { price: "desc" };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          card: { select: CARD_SELECT },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    // Batch fetch seller ratings in single query
    const sellerIds = [...new Set(listings.map((l) => l.userId))];
    const ratingAggs = await prisma.userRating.groupBy({
      by: ["rateeId"],
      where: { rateeId: { in: sellerIds } },
      _avg: { score: true },
    });
    const ratingMap = new Map<string, number | null>(
      ratingAggs.map((r) => [r.rateeId, r._avg.score]),
    );

    return {
      success: true,
      data: {
        listings: listings.map((l) => mapListing(l, ratingMap.get(l.userId) ?? null)),
        total,
        page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to browse listings") };
  }
}

export async function getUserListingsByStatus(
  userId: string,
  status?: string,
): Promise<Result<{ listings: ListingItem[]; stats: { active: number; sold: number; cancelled: number; revenue: number } }>> {
  try {
    const statusFilter = status ? { status: status as PrismaListingStatus } : {};
    const listings = await prisma.listing.findMany({
      where: { userId, ...statusFilter },
      include: {
        user: { select: { id: true, name: true, image: true } },
        card: { select: CARD_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });
    const avgRating = await getSellerRating(userId);

    // Compute stats
    const [activeCount, soldCount, cancelledCount, revenueResult] = await Promise.all([
      prisma.listing.count({ where: { userId, status: "ACTIVE" } }),
      prisma.listing.count({ where: { userId, status: "SOLD" } }),
      prisma.listing.count({ where: { userId, status: "CANCELLED" } }),
      prisma.transaction.aggregate({
        where: { sellerId: userId },
        _sum: { price: true },
      }),
    ]);

    return {
      success: true,
      data: {
        listings: listings.map((l) => mapListing(l, avgRating)),
        stats: {
          active: activeCount,
          sold: soldCount,
          cancelled: cancelledCount,
          revenue: revenueResult._sum.price ? Number(revenueResult._sum.price) : 0,
        },
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch listings") };
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
