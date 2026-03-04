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
    const collectionCards = await prisma.collectionCard.findMany({
      where: { collection: { userId } },
      select: {
        quantity: true,
        card: { select: { marketPrice: true } },
      },
    });

    const value = collectionCards.reduce((sum, cc) => {
      const price = cc.card.marketPrice ? Number(cc.card.marketPrice) : 0;
      return sum + price * cc.quantity;
    }, 0);

    const cardCount = collectionCards.reduce((sum, cc) => sum + cc.quantity, 0);

    await prisma.portfolioSnapshot.create({
      data: { userId, value, cardCount },
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
