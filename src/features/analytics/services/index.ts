import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { AnalyticsData, GameBreakdown, RarityBreakdown, TopCard } from "../types";

export async function getAnalytics(userId: string): Promise<Result<AnalyticsData>> {
  try {
    const collectionCards = await prisma.collectionCard.findMany({
      where: { collection: { userId } },
      select: {
        quantity: true,
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
    });

    const collectionsCount = await prisma.collection.count({ where: { userId } });

    // Game breakdown
    const gameMap = new Map<string, { cardCount: number; totalValue: number }>();
    for (const cc of collectionCards) {
      const game = cc.card.gameType;
      const price = cc.card.marketPrice ? Number(cc.card.marketPrice) : 0;
      const existing = gameMap.get(game) ?? { cardCount: 0, totalValue: 0 };
      existing.cardCount += cc.quantity;
      existing.totalValue += price * cc.quantity;
      gameMap.set(game, existing);
    }
    const gameBreakdown: GameBreakdown[] = Array.from(gameMap.entries())
      .map(([gameType, data]) => ({ gameType, ...data }))
      .sort((a, b) => b.totalValue - a.totalValue);

    // Rarity breakdown
    const rarityMap = new Map<string, number>();
    for (const cc of collectionCards) {
      const rarity = cc.card.rarity ?? "Unknown";
      rarityMap.set(rarity, (rarityMap.get(rarity) ?? 0) + cc.quantity);
    }
    const rarityBreakdown: RarityBreakdown[] = Array.from(rarityMap.entries())
      .map(([rarity, count]) => ({ rarity, count }))
      .sort((a, b) => b.count - a.count);

    // Top cards by total value
    const cardValueMap = new Map<string, TopCard>();
    for (const cc of collectionCards) {
      const price = cc.card.marketPrice ? Number(cc.card.marketPrice) : 0;
      if (price === 0) continue;
      const existing = cardValueMap.get(cc.card.id);
      if (existing) {
        existing.quantity += cc.quantity;
        existing.totalValue += price * cc.quantity;
      } else {
        cardValueMap.set(cc.card.id, {
          id: cc.card.id,
          name: cc.card.name,
          gameType: cc.card.gameType,
          setName: cc.card.setName,
          imageUrl: cc.card.imageUrl,
          marketPrice: price,
          quantity: cc.quantity,
          totalValue: price * cc.quantity,
        });
      }
    }
    const topCards = Array.from(cardValueMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    // Summary stats
    const totalCardCopies = collectionCards.reduce((sum, cc) => sum + cc.quantity, 0);
    const totalUniqueCards = new Set(collectionCards.map((cc) => cc.card.id)).size;
    const totalValue = collectionCards.reduce((sum, cc) => {
      const price = cc.card.marketPrice ? Number(cc.card.marketPrice) : 0;
      return sum + price * cc.quantity;
    }, 0);
    const avgCardValue = totalCardCopies > 0 ? totalValue / totalCardCopies : 0;

    return {
      success: true,
      data: {
        gameBreakdown,
        rarityBreakdown,
        topCards,
        totalUniqueCards,
        totalCardCopies,
        totalValue,
        avgCardValue,
        collectionsCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to fetch analytics"),
    };
  }
}
