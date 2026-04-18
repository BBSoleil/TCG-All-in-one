import { prisma } from "@/shared/lib/prisma";
import type { GameType as PrismaGameType } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";

// Re-export split modules so all existing imports continue to work
export { getCollectionCards, getAllCollectionCards, addCardToCollection, updateCollectionCard, updateCollectionCardFlags, removeCardFromCollection, matchAndImportCards, getUserTotalCardCount } from "./collection-cards";
export type { ImportRow, ImportResult } from "./collection-cards";
export { getDashboardStats, getSetCompletion } from "./stats";

export interface CollectionWithStats {
  id: string;
  name: string;
  gameType: string;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { cards: number };
  portfolioValue?: number;
}

export interface CollectionCardWithDetails {
  id: string;
  quantity: number;
  condition: string;
  language: string;
  foil: boolean;
  forSale: boolean;
  forTrade: boolean;
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

export interface PaginatedCollectionCards {
  cards: CollectionCardWithDetails[];
  total: number;
  page: number;
  totalPages: number;
  collectionValue: number;
}

export async function getUserCollections(
  userId: string,
): Promise<Result<CollectionWithStats[]>> {
  try {
    const [collections, valueRows] = await Promise.all([
      prisma.collection.findMany({
        where: { userId },
        include: { _count: { select: { cards: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.$queryRawUnsafe<{ collectionId: string; value: number }[]>(
        `SELECT col.id as "collectionId",
                COALESCE(SUM(cc.quantity * COALESCE(c."marketPrice", 0)), 0)::float as value
         FROM "collections" col
         LEFT JOIN "collection_cards" cc ON cc."collectionId" = col.id
         LEFT JOIN "cards" c ON c.id = cc."cardId"
         WHERE col."userId" = $1
         GROUP BY col.id`,
        userId,
      ),
    ]);

    const valueMap = new Map(valueRows.map((r) => [r.collectionId, r.value]));

    const enriched = collections.map((col) => ({
      ...col,
      portfolioValue: valueMap.get(col.id) ?? 0,
    }));

    return { success: true, data: enriched };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch collections") };
  }
}

export async function getCollectionById(
  id: string,
  userId: string,
): Promise<Result<CollectionWithStats>> {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id, userId },
      include: { _count: { select: { cards: true } } },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }
    return { success: true, data: collection };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch collection") };
  }
}

export async function createCollection(
  userId: string,
  name: string,
  gameType: string,
): Promise<Result<{ id: string }>> {
  try {
    const collection = await prisma.collection.create({
      data: { name, gameType: gameType as PrismaGameType, userId },
      select: { id: true },
    });
    return { success: true, data: collection };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to create collection") };
  }
}

export async function updateCollection(
  id: string,
  userId: string,
  name: string,
): Promise<Result<{ id: string }>> {
  try {
    const existing = await prisma.collection.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return { success: false, error: new Error("Collection not found") };
    }
    const collection = await prisma.collection.update({
      where: { id },
      data: { name },
      select: { id: true },
    });
    return { success: true, data: collection };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update collection") };
  }
}

export async function deleteCollection(
  id: string,
  userId: string,
): Promise<Result<void>> {
  try {
    const existing = await prisma.collection.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return { success: false, error: new Error("Collection not found") };
    }
    await prisma.collection.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to delete collection") };
  }
}
