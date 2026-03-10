import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

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
  gameType?: string,
): Promise<Result<{ setName: string; owned: number; total: number }[]>> {
  try {
    // When gameType is provided, skip the correlated subquery on 90k cards
    const gameTypeClause = gameType
      ? `"gameType" = $3`
      : `"gameType" = (SELECT "gameType" FROM "Collection" WHERE id = $1)`;

    const params: unknown[] = [collectionId, userId];
    if (gameType) params.push(gameType);

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
         WHERE ${gameTypeClause}
           AND "setName" IS NOT NULL
         GROUP BY "setName"
       ) total ON total."setName" = owned."setName"
       ORDER BY owned."setName"`,
      ...params,
    );

    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch set completion") };
  }
}
