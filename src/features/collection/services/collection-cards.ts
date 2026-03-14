import { prisma } from "@/shared/lib/prisma";
import type { GameType as PrismaGameType } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";
import { ROOKIE_CARD_LIMIT } from "@/shared/constants";
import type { CollectionCardWithDetails, PaginatedCollectionCards } from "./index";

const CARDS_PER_PAGE = 24;

/** Sum of all card quantities across all of a user's collections */
export async function getUserTotalCardCount(userId: string): Promise<number> {
  const result = await prisma.$queryRawUnsafe<{ total: number }[]>(
    `SELECT COALESCE(SUM(cc.quantity), 0)::int as total
     FROM "CollectionCard" cc
     JOIN "Collection" col ON col.id = cc."collectionId"
     WHERE col."userId" = $1`,
    userId,
  );
  return result[0]?.total ?? 0;
}

async function checkFreemiumLimit(
  userId: string,
  additionalCards: number,
  existingQuantity = 0,
): Promise<Result<void>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  if (user?.subscriptionTier === "master") {
    return { success: true, data: undefined };
  }

  const currentTotal = await getUserTotalCardCount(userId);
  const netIncrease = additionalCards - existingQuantity;
  if (netIncrease > 0 && currentTotal + netIncrease > ROOKIE_CARD_LIMIT) {
    const remaining = Math.max(0, ROOKIE_CARD_LIMIT - currentTotal);
    return {
      success: false,
      error: new Error(
        `UPGRADE_REQUIRED:You've reached the free plan limit of ${ROOKIE_CARD_LIMIT.toLocaleString()} cards. ` +
        `You can add up to ${remaining.toLocaleString()} more. Upgrade to Master for unlimited cards.`,
      ),
    };
  }

  return { success: true, data: undefined };
}

export async function getCollectionCards(
  collectionId: string,
  userId: string,
  page = 1,
): Promise<Result<PaginatedCollectionCards>> {
  try {
    const offset = (page - 1) * CARDS_PER_PAGE;

    const [cards, total, valueRows] = await Promise.all([
      prisma.collectionCard.findMany({
        where: { collectionId },
        include: {
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
        orderBy: { addedAt: "desc" },
        take: CARDS_PER_PAGE,
        skip: offset,
      }),
      prisma.collectionCard.count({ where: { collectionId } }),
      prisma.$queryRawUnsafe<{ value: number }[]>(
        `SELECT COALESCE(SUM(cc.quantity * COALESCE(c."marketPrice", 0)), 0)::float as value
         FROM "CollectionCard" cc
         JOIN "Card" c ON c.id = cc."cardId"
         WHERE cc."collectionId" = $1`,
        collectionId,
      ),
    ]);

    return {
      success: true,
      data: {
        cards,
        total,
        page,
        totalPages: Math.ceil(total / CARDS_PER_PAGE),
        collectionValue: valueRows[0]?.value ?? 0,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch cards") };
  }
}

export async function getAllCollectionCards(
  collectionId: string,
  userId: string,
): Promise<Result<CollectionCardWithDetails[]>> {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { id: true },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }
    const cards = await prisma.collectionCard.findMany({
      where: { collectionId },
      include: {
        card: {
          select: {
            id: true, name: true, gameType: true, setName: true,
            rarity: true, imageUrl: true, marketPrice: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });
    return { success: true, data: cards };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch cards") };
  }
}

export async function addCardToCollection(
  collectionId: string,
  userId: string,
  cardId: string,
  quantity: number,
  condition?: string,
  notes?: string,
  language = "EN",
  foil = false,
): Promise<Result<{ id: string }>> {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return { success: false, error: new Error("Card not found") };
    }

    const condition_ = condition ?? "Near Mint";

    // Check for existing variant (same card + language + foil + condition)
    const existing = await prisma.collectionCard.findFirst({
      where: { collectionId, cardId, language, foil, condition: condition_ },
      select: { id: true, quantity: true },
    });

    // Check freemium limit (account for existing quantity if updating)
    const limitCheck = await checkFreemiumLimit(userId, quantity, existing?.quantity ?? 0);
    if (!limitCheck.success) {
      return { success: false, error: limitCheck.error };
    }

    if (existing) {
      const updated = await prisma.collectionCard.update({
        where: { id: existing.id },
        data: { quantity, notes },
        select: { id: true },
      });
      return { success: true, data: updated };
    } else {
      const created = await prisma.collectionCard.create({
        data: { collectionId, cardId, quantity, condition: condition_, language, foil, notes },
        select: { id: true },
      });
      return { success: true, data: created };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to add card") };
  }
}

export async function updateCollectionCard(
  id: string,
  userId: string,
  quantity: number,
  condition?: string,
  notes?: string,
): Promise<Result<{ id: string }>> {
  try {
    const existing = await prisma.collectionCard.findUnique({
      where: { id },
      include: { collection: { select: { userId: true } } },
    });
    if (!existing || existing.collection.userId !== userId) {
      return { success: false, error: new Error("Card not found in collection") };
    }

    const updated = await prisma.collectionCard.update({
      where: { id },
      data: { quantity, condition, notes },
      select: { id: true },
    });
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update card") };
  }
}

export async function removeCardFromCollection(
  id: string,
  userId: string,
): Promise<Result<void>> {
  try {
    const existing = await prisma.collectionCard.findUnique({
      where: { id },
      include: { collection: { select: { userId: true } } },
    });
    if (!existing || existing.collection.userId !== userId) {
      return { success: false, error: new Error("Card not found in collection") };
    }

    await prisma.collectionCard.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to remove card") };
  }
}

export async function updateCollectionCardFlags(
  id: string,
  userId: string,
  flags: { forSale?: boolean; forTrade?: boolean },
): Promise<Result<{ id: string }>> {
  try {
    const existing = await prisma.collectionCard.findUnique({
      where: { id },
      include: { collection: { select: { userId: true } } },
    });
    if (!existing || existing.collection.userId !== userId) {
      return { success: false, error: new Error("Card not found in collection") };
    }

    const updated = await prisma.collectionCard.update({
      where: { id },
      data: flags,
      select: { id: true },
    });
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update card flags") };
  }
}

export interface ImportRow {
  name: string;
  quantity: number;
  condition: string | null;
  notes: string | null;
}

export interface ImportResult {
  imported: number;
  total: number;
  errors: string[];
}

export async function matchAndImportCards(
  collectionId: string,
  gameType: string,
  rows: ImportRow[],
  parseErrors: string[] = [],
  language = "EN",
): Promise<Result<ImportResult>> {
  try {
    // Check freemium limit for the batch
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId },
      select: { userId: true },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }
    const batchTotal = rows.reduce((sum, r) => sum + r.quantity, 0);
    const limitCheck = await checkFreemiumLimit(collection.userId, batchTotal);
    if (!limitCheck.success) {
      return { success: false, error: limitCheck.error };
    }

    const cardNames = [...new Set(rows.map((r) => r.name))];

    const matchedCards = await prisma.card.findMany({
      where: {
        gameType: gameType as PrismaGameType,
        name: { in: cardNames, mode: "insensitive" },
      },
      select: { id: true, name: true },
    });

    // Build name -> card ID map (case-insensitive)
    const nameToId = new Map<string, string>();
    for (const card of matchedCards) {
      nameToId.set(card.name.toLowerCase(), card.id);
    }

    let imported = 0;
    const importErrors: string[] = [...parseErrors];

    for (const row of rows) {
      const cardId = nameToId.get(row.name.toLowerCase());
      if (!cardId) {
        importErrors.push(`Card not found: "${row.name}"`);
        continue;
      }

      const condition_ = row.condition ?? "Near Mint";
      const existing = await prisma.collectionCard.findFirst({
        where: { collectionId, cardId, language, foil: false, condition: condition_ },
        select: { id: true },
      });

      if (existing) {
        await prisma.collectionCard.update({
          where: { id: existing.id },
          data: { quantity: row.quantity, notes: row.notes },
        });
      } else {
        await prisma.collectionCard.create({
          data: {
            collectionId,
            cardId,
            quantity: row.quantity,
            condition: condition_,
            language,
            foil: false,
            notes: row.notes,
          },
        });
      }
      imported++;
    }

    return {
      success: true,
      data: { imported, total: rows.length, errors: importErrors },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to import cards") };
  }
}
