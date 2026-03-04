import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export async function recordPriceSnapshot(cardId: string, price: number): Promise<void> {
  await prisma.priceHistory.create({
    data: { cardId, price },
  });
}

export async function recordPriceSnapshots(
  updates: { cardId: string; price: number }[],
): Promise<number> {
  if (updates.length === 0) return 0;

  const result = await prisma.priceHistory.createMany({
    data: updates.map((u) => ({ cardId: u.cardId, price: u.price })),
    skipDuplicates: true,
  });

  return result.count;
}

export async function getPriceHistory(
  cardId: string,
  days = 90,
): Promise<Result<PriceHistoryPoint[]>> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await prisma.priceHistory.findMany({
      where: { cardId, recordedAt: { gte: since } },
      orderBy: { recordedAt: "asc" },
      select: { price: true, recordedAt: true },
    });

    const data: PriceHistoryPoint[] = records.map((r) => ({
      date: r.recordedAt.toISOString().split("T")[0] as string,
      price: Number(r.price),
    }));

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to fetch price history"),
    };
  }
}
