import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export interface ComparisonCard {
  id: string;
  name: string;
  gameType: string;
  setName: string | null;
  rarity: string | null;
  imageUrl: string | null;
  marketPrice: number;
}

export interface ComparisonResult {
  collectionA: { id: string; name: string; cardCount: number; totalValue: number };
  collectionB: { id: string; name: string; cardCount: number; totalValue: number };
  shared: ComparisonCard[];
  onlyInA: ComparisonCard[];
  onlyInB: ComparisonCard[];
}

export async function compareCollections(
  collectionAId: string,
  collectionBId: string,
  userId: string,
): Promise<Result<ComparisonResult>> {
  try {
    // Verify user owns collection A
    const colA = await prisma.collection.findFirst({
      where: { id: collectionAId, userId },
      select: { id: true, name: true },
    });
    if (!colA) {
      return { success: false, error: new Error("Collection A not found") };
    }

    // Collection B can be own or public
    const colB = await prisma.collection.findFirst({
      where: {
        id: collectionBId,
        OR: [{ userId }, { isPublic: true }],
      },
      select: { id: true, name: true },
    });
    if (!colB) {
      return { success: false, error: new Error("Collection B not found or not accessible") };
    }

    const [cardsA, cardsB] = await Promise.all([
      prisma.collectionCard.findMany({
        where: { collectionId: collectionAId },
        select: {
          quantity: true,
          card: {
            select: {
              id: true, name: true, gameType: true, setName: true,
              rarity: true, imageUrl: true, marketPrice: true,
            },
          },
        },
      }),
      prisma.collectionCard.findMany({
        where: { collectionId: collectionBId },
        select: {
          quantity: true,
          card: {
            select: {
              id: true, name: true, gameType: true, setName: true,
              rarity: true, imageUrl: true, marketPrice: true,
            },
          },
        },
      }),
    ]);

    const mapA = new Map(cardsA.map((cc) => [cc.card.id, cc]));
    const mapB = new Map(cardsB.map((cc) => [cc.card.id, cc]));

    function toComparisonCard(cc: (typeof cardsA)[0]): ComparisonCard {
      return {
        id: cc.card.id,
        name: cc.card.name,
        gameType: cc.card.gameType,
        setName: cc.card.setName,
        rarity: cc.card.rarity,
        imageUrl: cc.card.imageUrl,
        marketPrice: cc.card.marketPrice ? Number(cc.card.marketPrice) : 0,
      };
    }

    const shared: ComparisonCard[] = [];
    const onlyInA: ComparisonCard[] = [];
    const onlyInB: ComparisonCard[] = [];

    for (const [cardId, cc] of mapA) {
      if (mapB.has(cardId)) {
        shared.push(toComparisonCard(cc));
      } else {
        onlyInA.push(toComparisonCard(cc));
      }
    }
    for (const [cardId, cc] of mapB) {
      if (!mapA.has(cardId)) {
        onlyInB.push(toComparisonCard(cc));
      }
    }

    function calcValue(cards: (typeof cardsA)): number {
      return cards.reduce((sum, cc) => {
        const price = cc.card.marketPrice ? Number(cc.card.marketPrice) : 0;
        return sum + price * cc.quantity;
      }, 0);
    }

    return {
      success: true,
      data: {
        collectionA: {
          id: colA.id,
          name: colA.name,
          cardCount: cardsA.length,
          totalValue: calcValue(cardsA),
        },
        collectionB: {
          id: colB.id,
          name: colB.name,
          cardCount: cardsB.length,
          totalValue: calcValue(cardsB),
        },
        shared: shared.sort((a, b) => b.marketPrice - a.marketPrice),
        onlyInA: onlyInA.sort((a, b) => b.marketPrice - a.marketPrice),
        onlyInB: onlyInB.sort((a, b) => b.marketPrice - a.marketPrice),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to compare collections"),
    };
  }
}
