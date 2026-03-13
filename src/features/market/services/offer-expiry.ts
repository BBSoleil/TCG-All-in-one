import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export async function expireStaleOffers(): Promise<Result<{ expired: number }>> {
  try {
    const result = await prisma.offer.updateMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    console.log(`[offer-expiry] Expired ${result.count} stale offers`);
    return { success: true, data: { expired: result.count } };
  } catch (error) {
    console.error("[offer-expiry] Failed:", error);
    return { success: false, error: error instanceof Error ? error : new Error("Failed to expire offers") };
  }
}
