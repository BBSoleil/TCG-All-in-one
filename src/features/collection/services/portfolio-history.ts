import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export interface PortfolioDataPoint {
  date: string;
  value: number;
  cardCount: number;
}

export async function recordPortfolioSnapshot(
  userId: string,
): Promise<Result<void>> {
  try {
    const rows = await prisma.$queryRawUnsafe<
      { totalValue: number; cardCount: number }[]
    >(`
      SELECT
        COALESCE(SUM(cc.quantity * c."marketPrice"), 0)::float as "totalValue",
        COALESCE(SUM(cc.quantity), 0)::int as "cardCount"
      FROM "collection_cards" cc
      JOIN "cards" c ON c.id = cc."cardId"
      JOIN "collections" col ON col.id = cc."collectionId"
      WHERE col."userId" = $1
    `, userId);

    const { totalValue, cardCount } = rows[0] ?? { totalValue: 0, cardCount: 0 };

    await prisma.portfolioSnapshot.create({
      data: { userId, value: totalValue, cardCount },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to record snapshot"),
    };
  }
}

export async function getPortfolioHistory(
  userId: string,
  days = 30,
): Promise<Result<PortfolioDataPoint[]>> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { userId, recordedAt: { gte: since } },
      orderBy: { recordedAt: "asc" },
      select: { value: true, cardCount: true, recordedAt: true },
    });

    const data: PortfolioDataPoint[] = snapshots.map((s) => ({
      date: s.recordedAt.toISOString().split("T")[0] as string,
      value: Number(s.value),
      cardCount: s.cardCount,
    }));

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to fetch history"),
    };
  }
}
