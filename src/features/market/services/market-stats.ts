import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export interface PriceMover {
  cardId: string;
  cardName: string;
  gameType: string;
  imageUrl: string | null;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
}

export interface MarketOverviewData {
  totalActiveListings: number;
  transactionsLast24h: number;
  avgPriceByGame: { gameType: string; avgPrice: number; listingCount: number }[];
  topMovers: PriceMover[];
  hotCards: { cardId: string; cardName: string; gameType: string; imageUrl: string | null; listingCount: number }[];
}

export async function getTopPriceMovers(limit = 10): Promise<Result<PriceMover[]>> {
  try {
    // Get cards with biggest price changes in last 7 days
    const rows = await prisma.$queryRawUnsafe<PriceMover[]>(
      `WITH recent AS (
        SELECT DISTINCT ON (ph."cardId")
          ph."cardId",
          ph.price::float as "currentPrice",
          ph."recordedAt"
        FROM price_history ph
        ORDER BY ph."cardId", ph."recordedAt" DESC
      ),
      older AS (
        SELECT DISTINCT ON (ph."cardId")
          ph."cardId",
          ph.price::float as "previousPrice"
        FROM price_history ph
        WHERE ph."recordedAt" < NOW() - INTERVAL '7 days'
        ORDER BY ph."cardId", ph."recordedAt" DESC
      )
      SELECT
        r."cardId",
        c.name as "cardName",
        c."gameType",
        c."imageUrl",
        r."currentPrice",
        o."previousPrice",
        CASE WHEN o."previousPrice" > 0
          THEN ROUND(((r."currentPrice" - o."previousPrice") / o."previousPrice" * 100)::numeric, 1)::float
          ELSE 0
        END as "changePercent"
      FROM recent r
      JOIN older o ON o."cardId" = r."cardId"
      JOIN "Card" c ON c.id = r."cardId"
      WHERE o."previousPrice" > 0 AND r."currentPrice" != o."previousPrice"
      ORDER BY ABS(r."currentPrice" - o."previousPrice") DESC
      LIMIT $1`,
      limit,
    );

    return { success: true, data: rows };
  } catch {
    return { success: true, data: [] };
  }
}

export async function getMarketOverview(): Promise<Result<MarketOverviewData>> {
  try {
    const [activeListings, recentTransactions, avgByGame, hotCards, moversResult] = await Promise.all([
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.count({
        where: { completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.$queryRawUnsafe<{ gameType: string; avgPrice: number; listingCount: number }[]>(
        `SELECT c."gameType",
                AVG(l.price)::float as "avgPrice",
                COUNT(*)::int as "listingCount"
         FROM "Listing" l
         JOIN "Card" c ON c.id = l."cardId"
         WHERE l.status = 'ACTIVE'
         GROUP BY c."gameType"
         ORDER BY "listingCount" DESC`,
      ),
      prisma.$queryRawUnsafe<{ cardId: string; cardName: string; gameType: string; imageUrl: string | null; listingCount: number }[]>(
        `SELECT c.id as "cardId", c.name as "cardName", c."gameType", c."imageUrl",
                COUNT(l.id)::int as "listingCount"
         FROM "Listing" l
         JOIN "Card" c ON c.id = l."cardId"
         WHERE l.status = 'ACTIVE'
         GROUP BY c.id, c.name, c."gameType", c."imageUrl"
         ORDER BY "listingCount" DESC
         LIMIT 8`,
      ),
      getTopPriceMovers(10),
    ]);

    return {
      success: true,
      data: {
        totalActiveListings: activeListings,
        transactionsLast24h: recentTransactions,
        avgPriceByGame: avgByGame,
        topMovers: moversResult.success ? moversResult.data : [],
        hotCards: hotCards,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch market overview") };
  }
}
