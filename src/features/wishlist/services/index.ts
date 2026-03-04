import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export interface WishlistCardWithDetails {
  id: string;
  targetPrice: unknown;
  notes: string | null;
  addedAt: Date;
  card: {
    id: string;
    name: string;
    gameType: string;
    setName: string | null;
    rarity: string | null;
    imageUrl: string | null;
    marketPrice: unknown;
  };
}

export async function getUserWishlist(
  userId: string,
): Promise<Result<WishlistCardWithDetails[]>> {
  try {
    const items = await prisma.wishlistCard.findMany({
      where: { userId },
      include: {
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
      },
      orderBy: { addedAt: "desc" },
    });
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch wishlist") };
  }
}

export async function addToWishlist(
  userId: string,
  cardId: string,
  targetPrice?: number,
  notes?: string,
): Promise<Result<{ id: string }>> {
  try {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return { success: false, error: new Error("Card not found") };
    }

    const item = await prisma.wishlistCard.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: { userId, cardId, targetPrice, notes },
      update: { targetPrice, notes },
      select: { id: true },
    });
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to add to wishlist") };
  }
}

export async function removeFromWishlist(
  id: string,
  userId: string,
): Promise<Result<void>> {
  try {
    const existing = await prisma.wishlistCard.findUnique({
      where: { id },
    });
    if (!existing || existing.userId !== userId) {
      return { success: false, error: new Error("Wishlist item not found") };
    }

    await prisma.wishlistCard.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to remove from wishlist") };
  }
}

export async function getWishlistAlerts(userId: string): Promise<
  Result<{
    card: { id: string; name: string; marketPrice: unknown };
    targetPrice: unknown;
  }[]>
> {
  try {
    const items = await prisma.wishlistCard.findMany({
      where: {
        userId,
        targetPrice: { not: null },
      },
      include: {
        card: {
          select: { id: true, name: true, marketPrice: true },
        },
      },
    });

    // Filter for cards where market price <= target price
    const alerts = items.filter((item) => {
      const market = item.card.marketPrice ? Number(item.card.marketPrice) : null;
      const target = item.targetPrice ? Number(item.targetPrice) : null;
      return market !== null && target !== null && market <= target;
    });

    return {
      success: true,
      data: alerts.map((a) => ({
        card: a.card,
        targetPrice: a.targetPrice,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to check alerts") };
  }
}
