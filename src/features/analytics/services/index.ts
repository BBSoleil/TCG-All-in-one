import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { AnalyticsData, GameBreakdown, RarityBreakdown, TopCard } from "../types";

export async function getAnalytics(userId: string): Promise<Result<AnalyticsData>> {
  try {
    // Run all aggregations in parallel via raw SQL
    const [gameRows, rarityRows, topCardRows, summaryRows, collectionsCount] = await Promise.all([
      // Game breakdown
      prisma.$queryRawUnsafe<{ gameType: string; cardCount: number; totalValue: number }[]>(`
        SELECT c."gameType" as "gameType",
               SUM(cc.quantity)::int as "cardCount",
               COALESCE(SUM(cc.quantity * c."marketPrice"), 0)::float as "totalValue"
        FROM "CollectionCard" cc
        JOIN "Card" c ON c.id = cc."cardId"
        JOIN "Collection" col ON col.id = cc."collectionId"
        WHERE col."userId" = $1
        GROUP BY c."gameType"
        ORDER BY "totalValue" DESC
      `, userId),
      // Rarity breakdown
      prisma.$queryRawUnsafe<{ rarity: string; count: number }[]>(`
        SELECT COALESCE(c.rarity::text, 'Unknown') as rarity,
               SUM(cc.quantity)::int as count
        FROM "CollectionCard" cc
        JOIN "Card" c ON c.id = cc."cardId"
        JOIN "Collection" col ON col.id = cc."collectionId"
        WHERE col."userId" = $1
        GROUP BY c.rarity
        ORDER BY count DESC
      `, userId),
      // Top 10 cards by total value
      prisma.$queryRawUnsafe<{ id: string; name: string; gameType: string; setName: string | null; imageUrl: string | null; marketPrice: number; quantity: number; totalValue: number }[]>(`
        SELECT c.id, c.name, c."gameType" as "gameType", c."setName" as "setName",
               c."imageUrl" as "imageUrl", c."marketPrice"::float as "marketPrice",
               SUM(cc.quantity)::int as quantity,
               (SUM(cc.quantity) * c."marketPrice")::float as "totalValue"
        FROM "CollectionCard" cc
        JOIN "Card" c ON c.id = cc."cardId"
        JOIN "Collection" col ON col.id = cc."collectionId"
        WHERE col."userId" = $1 AND c."marketPrice" IS NOT NULL AND c."marketPrice" > 0
        GROUP BY c.id
        ORDER BY "totalValue" DESC
        LIMIT 10
      `, userId),
      // Summary stats
      prisma.$queryRawUnsafe<{ totalCardCopies: number; totalUniqueCards: number; totalValue: number }[]>(`
        SELECT
          COALESCE(SUM(cc.quantity), 0)::int as "totalCardCopies",
          COUNT(DISTINCT cc."cardId")::int as "totalUniqueCards",
          COALESCE(SUM(cc.quantity * c."marketPrice"), 0)::float as "totalValue"
        FROM "CollectionCard" cc
        JOIN "Card" c ON c.id = cc."cardId"
        JOIN "Collection" col ON col.id = cc."collectionId"
        WHERE col."userId" = $1
      `, userId),
      prisma.collection.count({ where: { userId } }),
    ]);

    const gameBreakdown: GameBreakdown[] = gameRows.map((r) => ({
      gameType: r.gameType,
      cardCount: Number(r.cardCount),
      totalValue: Number(r.totalValue),
    }));

    const rarityBreakdown: RarityBreakdown[] = rarityRows.map((r) => ({
      rarity: r.rarity,
      count: Number(r.count),
    }));

    const topCards: TopCard[] = topCardRows.map((r) => ({
      id: r.id,
      name: r.name,
      gameType: r.gameType,
      setName: r.setName,
      imageUrl: r.imageUrl,
      marketPrice: Number(r.marketPrice),
      quantity: Number(r.quantity),
      totalValue: Number(r.totalValue),
    }));

    const summary = summaryRows[0] ?? { totalCardCopies: 0, totalUniqueCards: 0, totalValue: 0 };
    const totalCardCopies = Number(summary.totalCardCopies);
    const totalValue = Number(summary.totalValue);
    const avgCardValue = totalCardCopies > 0 ? totalValue / totalCardCopies : 0;

    return {
      success: true,
      data: {
        gameBreakdown,
        rarityBreakdown,
        topCards,
        totalUniqueCards: Number(summary.totalUniqueCards),
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
