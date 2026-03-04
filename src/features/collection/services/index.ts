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

export async function getCollectionCards(
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
    const collections = await prisma.collection.findMany({
      where: { userId },
      select: {
        gameType: true,
        _count: { select: { cards: true } },
      },
    });

    const totalCollections = collections.length;
    const totalCards = collections.reduce((sum, c) => sum + c._count.cards, 0);

    const gameMap = new Map<string, number>();
    for (const c of collections) {
      gameMap.set(c.gameType, (gameMap.get(c.gameType) ?? 0) + 1);
    }
    const collectionsByGame = Array.from(gameMap.entries()).map(
      ([gameType, count]) => ({ gameType, count }),
    );

    // Calculate portfolio value
    const collectionCards = await prisma.collectionCard.findMany({
      where: { collection: { userId } },
      select: {
        quantity: true,
        card: { select: { marketPrice: true } },
      },
    });
    const portfolioValue = collectionCards.reduce((sum, cc) => {
      const price = cc.card.marketPrice ? Number(cc.card.marketPrice) : 0;
      return sum + price * cc.quantity;
    }, 0);

    return {
      success: true,
      data: { totalCollections, totalCards, portfolioValue, collectionsByGame },
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
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { gameType: true },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }

    // Get cards owned in this collection grouped by set
    const ownedCards = await prisma.collectionCard.findMany({
      where: { collectionId },
      select: { card: { select: { setName: true } } },
    });
    const ownedBySet = new Map<string, number>();
    for (const cc of ownedCards) {
      if (cc.card.setName) {
        ownedBySet.set(cc.card.setName, (ownedBySet.get(cc.card.setName) ?? 0) + 1);
      }
    }

    // Get total cards per set for this game type
    const setNames = Array.from(ownedBySet.keys());
    if (setNames.length === 0) {
      return { success: true, data: [] };
    }

    const setCounts = await prisma.card.groupBy({
      by: ["setName"],
      where: {
        gameType: collection.gameType,
        setName: { in: setNames },
      },
      _count: { id: true },
    });

    const completion = setCounts
      .filter((sc) => sc.setName !== null)
      .map((sc) => ({
        setName: sc.setName as string,
        owned: ownedBySet.get(sc.setName as string) ?? 0,
        total: sc._count.id,
      }))
      .sort((a, b) => a.setName.localeCompare(b.setName));

    return { success: true, data: completion };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch set completion") };
  }
}
