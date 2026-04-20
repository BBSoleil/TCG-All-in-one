import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { GameType } from "@/shared/types";

export interface TrackedSet {
  gameType: GameType;
  setName: string;
  setCode: string | null;
  uniqueOwned: number;
  totalCards: number;
  completionPct: number;
  ownedValue: number;
}

/**
 * Returns every (gameType, setName) where the user owns at least one card,
 * with per-set completion metrics. This is the "standard collections" view:
 * sets become collections automatically — no user action required.
 */
export async function getTrackedSets(
  userId: string,
): Promise<Result<TrackedSet[]>> {
  try {
    const rows = await prisma.$queryRawUnsafe<
      {
        gameType: string;
        setName: string;
        setCode: string | null;
        uniqueOwned: number;
        totalCards: number;
        ownedValue: number;
      }[]
    >(
      `WITH owned AS (
        SELECT
          c."gameType"           AS "gameType",
          c."setName"            AS "setName",
          MIN(c."setCode")       AS "setCode",
          COUNT(DISTINCT cc."cardId")::int                        AS "uniqueOwned",
          COALESCE(SUM(cc.quantity * COALESCE(c."marketPrice", 0)), 0)::float
                                                                  AS "ownedValue"
        FROM "collection_cards" cc
        JOIN "collections"      col ON col.id = cc."collectionId"
        JOIN "cards"            c   ON c.id  = cc."cardId"
        WHERE col."userId" = $1 AND c."setName" IS NOT NULL
        GROUP BY c."gameType", c."setName"
      ),
      totals AS (
        SELECT "gameType", "setName", COUNT(*)::int AS "totalCards"
        FROM "cards"
        WHERE "setName" IS NOT NULL
        GROUP BY "gameType", "setName"
      )
      SELECT
        o."gameType",
        o."setName",
        o."setCode",
        o."uniqueOwned",
        t."totalCards",
        o."ownedValue"
      FROM owned o
      JOIN totals t
        ON t."gameType" = o."gameType" AND t."setName" = o."setName"
      ORDER BY o."gameType" ASC, o."setCode" ASC NULLS LAST`,
      userId,
    );

    const tracked: TrackedSet[] = rows.map((r) => ({
      gameType: r.gameType as GameType,
      setName: r.setName,
      setCode: r.setCode,
      uniqueOwned: Number(r.uniqueOwned),
      totalCards: Number(r.totalCards),
      completionPct:
        r.totalCards > 0
          ? Math.round((Number(r.uniqueOwned) / Number(r.totalCards)) * 100)
          : 0,
      ownedValue: Number(r.ownedValue),
    }));

    return { success: true, data: tracked };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to fetch tracked sets"),
    };
  }
}
