import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { UserRatingInfo, WishlistMatch } from "../types";

export async function rateTransaction(
  transactionId: string,
  raterId: string,
  score: number,
  comment?: string,
): Promise<Result<void>> {
  try {
    if (score < 1 || score > 5) {
      return { success: false, error: new Error("Score must be between 1 and 5") };
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) {
      return { success: false, error: new Error("Transaction not found") };
    }

    // Determine ratee (the other party)
    let rateeId: string;
    if (transaction.sellerId === raterId) {
      rateeId = transaction.buyerId;
    } else if (transaction.buyerId === raterId) {
      rateeId = transaction.sellerId;
    } else {
      return { success: false, error: new Error("Not part of this transaction") };
    }

    await prisma.userRating.upsert({
      where: { transactionId_raterId: { transactionId, raterId } },
      create: { transactionId, raterId, rateeId, score, comment: comment || null },
      update: { score, comment: comment || null },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to submit rating") };
  }
}

export async function getUserRating(userId: string): Promise<Result<UserRatingInfo>> {
  try {
    const result = await prisma.userRating.aggregate({
      where: { rateeId: userId },
      _avg: { score: true },
      _count: { score: true },
    });
    return {
      success: true,
      data: {
        avgRating: result._avg.score,
        totalRatings: result._count.score,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch rating") };
  }
}

export async function getWishlistMatches(
  userId: string,
): Promise<Result<WishlistMatch[]>> {
  try {
    // Get user's wishlist card IDs
    const wishlistCards = await prisma.wishlistCard.findMany({
      where: { userId },
      select: { id: true, cardId: true, targetPrice: true },
    });
    if (wishlistCards.length === 0) {
      return { success: true, data: [] };
    }

    const cardIds = wishlistCards.map((w) => w.cardId);

    // Find active listings for those cards (excluding user's own)
    const listings = await prisma.listing.findMany({
      where: {
        cardId: { in: cardIds },
        status: "ACTIVE",
        userId: { not: userId },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        card: {
          select: {
            id: true,
            name: true,
            gameType: true,
            setName: true,
            rarity: true,
            imageUrl: true,
            marketPrice: true,
          },
        },
        shippingZones: true,
      },
      orderBy: { price: "asc" },
    });

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

    // Map wishlist card IDs to their target prices
    const wishlistMap = new Map(
      wishlistCards.map((w) => [w.cardId, { id: w.id, targetPrice: w.targetPrice ? Number(w.targetPrice) : null }]),
    );

    const matches: WishlistMatch[] = listings.map((l) => {
      const wl = wishlistMap.get(l.cardId);
      return {
        listing: {
          id: l.id,
          price: Number(l.price),
          currency: l.currency,
          language: l.language,
          photos: l.photos,
          condition: l.condition,
          description: l.description,
          quantity: l.quantity,
          isTradeOnly: l.isTradeOnly,
          status: l.status,
          shippingZones: (l.shippingZones ?? []).map((sz) => ({
            zone: sz.zone,
            price: Number(sz.price),
            currency: sz.currency,
            estimatedMin: sz.estimatedMin,
            estimatedMax: sz.estimatedMax,
          })),
          createdAt: l.createdAt,
          seller: { ...l.user, avgRating: ratingMap.get(l.userId) ?? null },
          card: l.card,
        },
        wishlistCardId: wl?.id ?? "",
        targetPrice: wl?.targetPrice ?? null,
      };
    });

    return { success: true, data: matches };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to find matches") };
  }
}
