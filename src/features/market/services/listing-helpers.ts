import { prisma } from "@/shared/lib/prisma";
import type { ListingItem } from "../types";

export const CARD_SELECT = {
  id: true,
  name: true,
  gameType: true,
  setName: true,
  rarity: true,
  imageUrl: true,
  marketPrice: true,
} as const;

export async function getSellerRating(userId: string): Promise<number | null> {
  const result = await prisma.userRating.aggregate({
    where: { rateeId: userId },
    _avg: { score: true },
  });
  return result._avg.score;
}

export function mapListing(
  listing: {
    id: string;
    price: unknown;
    currency: string;
    language: string;
    photos: string[];
    condition: string;
    description: string | null;
    quantity: number;
    isTradeOnly: boolean;
    status: string;
    createdAt: Date;
    user: { id: string; name: string | null; image: string | null };
    card: { id: string; name: string; gameType: string; setName: string | null; rarity: string | null; imageUrl: string | null; marketPrice: unknown };
    shippingZones?: { id: string; zone: string; price: unknown; currency: string; estimatedMin: number; estimatedMax: number }[];
  },
  avgRating: number | null,
): ListingItem {
  return {
    id: listing.id,
    price: Number(listing.price),
    currency: listing.currency,
    language: listing.language,
    photos: listing.photos,
    condition: listing.condition,
    description: listing.description,
    quantity: listing.quantity,
    isTradeOnly: listing.isTradeOnly,
    status: listing.status,
    shippingZones: (listing.shippingZones ?? []).map((sz) => ({
      zone: sz.zone,
      price: Number(sz.price),
      currency: sz.currency,
      estimatedMin: sz.estimatedMin,
      estimatedMax: sz.estimatedMax,
    })),
    createdAt: listing.createdAt,
    seller: { ...listing.user, avgRating },
    card: listing.card,
  };
}
