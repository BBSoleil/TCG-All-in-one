import { prisma } from "@/shared/lib/prisma";
import type { GameType as PrismaGameType } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";
import type { GameType } from "@/shared/types";

export interface SetProgressCard {
  id: string;
  name: string;
  setCode: string | null;
  rarity: string | null;
  imageUrl: string | null;
  marketPrice: number | null;
  /** Total quantity the user owns across all their collections (any condition/language/foil). */
  ownedQuantity: number;
}

export interface SetProgress {
  gameType: GameType;
  setName: string;
  setCode: string | null;
  /** Language filter applied, or null for "all languages" */
  language: string | null;
  /** All distinct languages the user owns in this set */
  availableLanguages: string[];
  totalCards: number;
  uniqueOwned: number;
  totalOwnedCopies: number;
  completionPct: number;
  estimatedValueOwned: number;
  estimatedValueTotal: number;
  cards: SetProgressCard[];
}

/**
 * Computed "standard collection" per set. No DB row created — we derive
 * ownership by joining Card (set) with CollectionCard (user's collections).
 * Lazy-saved on first add through the normal collection flow.
 *
 * When `language` is provided, ownership only counts copies in that language
 * (so a user tracking FR vs EN sees distinct completion percentages). When
 * null/undefined, all languages are summed.
 */
export async function getSetProgress(
  userId: string,
  gameType: GameType,
  setName: string,
  language?: string | null,
): Promise<Result<SetProgress>> {
  try {
    const ownershipQuery = language
      ? `SELECT cc."cardId" as "cardId", SUM(cc.quantity)::int as owned
         FROM "collection_cards" cc
         JOIN "collections" col ON col.id = cc."collectionId"
         JOIN "cards" c ON c.id = cc."cardId"
         WHERE col."userId" = $1 AND c."gameType" = $2 AND c."setName" = $3
           AND cc.language = $4
         GROUP BY cc."cardId"`
      : `SELECT cc."cardId" as "cardId", SUM(cc.quantity)::int as owned
         FROM "collection_cards" cc
         JOIN "collections" col ON col.id = cc."collectionId"
         JOIN "cards" c ON c.id = cc."cardId"
         WHERE col."userId" = $1 AND c."gameType" = $2 AND c."setName" = $3
         GROUP BY cc."cardId"`;

    const ownershipParams: unknown[] = language
      ? [userId, gameType, setName, language]
      : [userId, gameType, setName];

    const [cards, ownedRows, langRows] = await Promise.all([
      prisma.card.findMany({
        where: { gameType: gameType as PrismaGameType, setName },
        select: {
          id: true,
          name: true,
          setCode: true,
          rarity: true,
          imageUrl: true,
          marketPrice: true,
        },
        orderBy: [{ setCode: "asc" }, { name: "asc" }],
      }),
      prisma.$queryRawUnsafe<{ cardId: string; owned: number }[]>(
        ownershipQuery,
        ...ownershipParams,
      ),
      prisma.$queryRawUnsafe<{ language: string }[]>(
        `SELECT DISTINCT cc.language
         FROM "collection_cards" cc
         JOIN "collections" col ON col.id = cc."collectionId"
         JOIN "cards" c ON c.id = cc."cardId"
         WHERE col."userId" = $1 AND c."gameType" = $2 AND c."setName" = $3
         ORDER BY cc.language ASC`,
        userId,
        gameType,
        setName,
      ),
    ]);

    const ownedMap = new Map(ownedRows.map((r) => [r.cardId, r.owned]));

    const enrichedCards: SetProgressCard[] = cards.map((c) => ({
      id: c.id,
      name: c.name,
      setCode: c.setCode,
      rarity: c.rarity,
      imageUrl: c.imageUrl,
      marketPrice: c.marketPrice ? Number(c.marketPrice) : null,
      ownedQuantity: ownedMap.get(c.id) ?? 0,
    }));

    const uniqueOwned = enrichedCards.filter((c) => c.ownedQuantity > 0).length;
    const totalOwnedCopies = enrichedCards.reduce((sum, c) => sum + c.ownedQuantity, 0);
    const totalCards = enrichedCards.length;
    const completionPct = totalCards > 0 ? Math.round((uniqueOwned / totalCards) * 100) : 0;

    const estimatedValueOwned = enrichedCards.reduce(
      (sum, c) => sum + (c.marketPrice ?? 0) * c.ownedQuantity,
      0,
    );
    const estimatedValueTotal = enrichedCards.reduce(
      (sum, c) => sum + (c.marketPrice ?? 0),
      0,
    );

    const setCode = enrichedCards[0]?.setCode ?? null;

    return {
      success: true,
      data: {
        gameType,
        setName,
        setCode,
        language: language ?? null,
        availableLanguages: langRows.map((r) => r.language).filter(Boolean),
        totalCards,
        uniqueOwned,
        totalOwnedCopies,
        completionPct,
        estimatedValueOwned,
        estimatedValueTotal,
        cards: enrichedCards,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to fetch set progress"),
    };
  }
}
