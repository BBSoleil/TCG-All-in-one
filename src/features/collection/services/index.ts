import { prisma } from "@/shared/lib/prisma";
import type { GameType as PrismaGameType } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";

export interface CollectionWithStats {
  id: string;
  name: string;
  gameType: string;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { cards: number };
}

export interface CollectionCardWithDetails {
  id: string;
  quantity: number;
  condition: string | null;
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

export async function getUserCollections(
  userId: string,
): Promise<Result<CollectionWithStats[]>> {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: { _count: { select: { cards: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: collections };
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

const CARDS_PER_PAGE = 24;

export interface PaginatedCollectionCards {
  cards: CollectionCardWithDetails[];
  total: number;
  page: number;
  totalPages: number;
  collectionValue: number;
}

export async function getCollectionCards(
  collectionId: string,
  userId: string,
  page = 1,
): Promise<Result<PaginatedCollectionCards>> {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { id: true },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }

    const offset = (page - 1) * CARDS_PER_PAGE;

    const [cards, total, valueRows] = await Promise.all([
      prisma.collectionCard.findMany({
        where: { collectionId },
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
        take: CARDS_PER_PAGE,
        skip: offset,
      }),
      prisma.collectionCard.count({ where: { collectionId } }),
      prisma.$queryRawUnsafe<{ value: number }[]>(
        `SELECT COALESCE(SUM(cc.quantity * COALESCE(c."marketPrice", 0)), 0)::float as value
         FROM "CollectionCard" cc
         JOIN "Card" c ON c.id = cc."cardId"
         WHERE cc."collectionId" = $1`,
        collectionId,
      ),
    ]);

    return {
      success: true,
      data: {
        cards,
        total,
        page,
        totalPages: Math.ceil(total / CARDS_PER_PAGE),
        collectionValue: valueRows[0]?.value ?? 0,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch cards") };
  }
}

export async function getAllCollectionCards(
  collectionId: string,
  userId: string,
): Promise<Result<CollectionCardWithDetails[]>> {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { id: true },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }
    const cards = await prisma.collectionCard.findMany({
      where: { collectionId },
      include: {
        card: {
          select: {
            id: true, name: true, gameType: true, setName: true,
            rarity: true, imageUrl: true, marketPrice: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });
    return { success: true, data: cards };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch cards") };
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

export async function addCardToCollection(
  collectionId: string,
  userId: string,
  cardId: string,
  quantity: number,
  condition?: string,
  notes?: string,
): Promise<Result<{ id: string }>> {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return { success: false, error: new Error("Card not found") };
    }

    const collectionCard = await prisma.collectionCard.upsert({
      where: { collectionId_cardId: { collectionId, cardId } },
      create: { collectionId, cardId, quantity, condition, notes },
      update: { quantity, condition, notes },
      select: { id: true },
    });
    return { success: true, data: collectionCard };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to add card") };
  }
}

export async function updateCollectionCard(
  id: string,
  userId: string,
  quantity: number,
  condition?: string,
  notes?: string,
): Promise<Result<{ id: string }>> {
  try {
    const existing = await prisma.collectionCard.findUnique({
      where: { id },
      include: { collection: { select: { userId: true } } },
    });
    if (!existing || existing.collection.userId !== userId) {
      return { success: false, error: new Error("Card not found in collection") };
    }

    const updated = await prisma.collectionCard.update({
      where: { id },
      data: { quantity, condition, notes },
      select: { id: true },
    });
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update card") };
  }
}

export async function removeCardFromCollection(
  id: string,
  userId: string,
): Promise<Result<void>> {
  try {
    const existing = await prisma.collectionCard.findUnique({
      where: { id },
      include: { collection: { select: { userId: true } } },
    });
    if (!existing || existing.collection.userId !== userId) {
      return { success: false, error: new Error("Card not found in collection") };
    }

    await prisma.collectionCard.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to remove card") };
  }
}

export async function getDashboardStats(userId: string): Promise<
  Result<{
    totalCollections: number;
    totalCards: number;
    portfolioValue: number;
    collectionsByGame: { gameType: string; count: number }[];
  }>
> {
  try {
    const [gameRows, summaryRows] = await Promise.all([
      prisma.$queryRawUnsafe<{ gameType: string; count: number }[]>(
        `SELECT "gameType", COUNT(*)::int as count
         FROM "Collection"
         WHERE "userId" = $1
         GROUP BY "gameType"`,
        userId,
      ),
      prisma.$queryRawUnsafe<{ totalCollections: number; totalCards: number; portfolioValue: number }[]>(
        `SELECT
           COUNT(DISTINCT col.id)::int as "totalCollections",
           COALESCE(SUM(cc.quantity), 0)::int as "totalCards",
           COALESCE(SUM(cc.quantity * COALESCE(c."marketPrice", 0)), 0)::float as "portfolioValue"
         FROM "Collection" col
         LEFT JOIN "CollectionCard" cc ON cc."collectionId" = col.id
         LEFT JOIN "Card" c ON c.id = cc."cardId"
         WHERE col."userId" = $1`,
        userId,
      ),
    ]);

    const summary = summaryRows[0] ?? { totalCollections: 0, totalCards: 0, portfolioValue: 0 };

    return {
      success: true,
      data: {
        totalCollections: summary.totalCollections,
        totalCards: summary.totalCards,
        portfolioValue: summary.portfolioValue,
        collectionsByGame: gameRows,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch stats") };
  }
}

export async function getSetCompletion(
  collectionId: string,
  userId: string,
): Promise<Result<{ setName: string; owned: number; total: number }[]>> {
  try {
    const rows = await prisma.$queryRawUnsafe<
      { setName: string; owned: number; total: number }[]
    >(
      `SELECT
         owned."setName",
         owned.owned::int,
         COALESCE(total.total, 0)::int as total
       FROM (
         SELECT c."setName", COUNT(DISTINCT cc."cardId")::int as owned
         FROM "CollectionCard" cc
         JOIN "Card" c ON c.id = cc."cardId"
         JOIN "Collection" col ON col.id = cc."collectionId"
         WHERE cc."collectionId" = $1 AND col."userId" = $2 AND c."setName" IS NOT NULL
         GROUP BY c."setName"
       ) owned
       LEFT JOIN (
         SELECT "setName", COUNT(*)::int as total
         FROM "Card"
         WHERE "gameType" = (SELECT "gameType" FROM "Collection" WHERE id = $1)
           AND "setName" IS NOT NULL
         GROUP BY "setName"
       ) total ON total."setName" = owned."setName"
       ORDER BY owned."setName"`,
      collectionId,
      userId,
    );

    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch set completion") };
  }
}
