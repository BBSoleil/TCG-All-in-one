import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { CollectionCardWithDetails, PaginatedCollectionCards } from "./index";

const CARDS_PER_PAGE = 24;

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
