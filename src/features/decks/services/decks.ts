import { prisma } from "@/shared/lib/prisma";
import type { GameType as PrismaGameType } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";
import type { Deck, DeckWithCards } from "../types";

const CARD_SELECT = {
  id: true,
  name: true,
  gameType: true,
  setName: true,
  rarity: true,
  imageUrl: true,
  marketPrice: true,
} as const;

export async function getUserDecks(
  userId: string,
): Promise<Result<Deck[]>> {
  try {
    const decks = await prisma.deck.findMany({
      where: { userId },
      include: { _count: { select: { cards: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return {
      success: true,
      data: decks.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        gameType: d.gameType as string as Deck["gameType"],
        format: d.format,
        isPublic: d.isPublic,
        userId: d.userId,
        cardCount: d._count.cards,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch decks") };
  }
}

export async function getDeckById(
  id: string,
  userId?: string,
): Promise<Result<DeckWithCards>> {
  try {
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        _count: { select: { cards: true } },
        cards: {
          include: { card: { select: CARD_SELECT } },
          orderBy: [{ isSideboard: "asc" }, { card: { name: "asc" } }],
        },
      },
    });
    if (!deck) {
      return { success: false, error: new Error("Deck not found") };
    }
    // Access control: only owner or public decks
    if (deck.userId !== userId && !deck.isPublic) {
      return { success: false, error: new Error("Deck not found") };
    }
    return {
      success: true,
      data: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        gameType: deck.gameType as string as Deck["gameType"],
        format: deck.format,
        isPublic: deck.isPublic,
        userId: deck.userId,
        cardCount: deck._count.cards,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        cards: deck.cards.map((dc) => ({
          id: dc.id,
          quantity: dc.quantity,
          isSideboard: dc.isSideboard,
          card: dc.card,
        })),
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch deck") };
  }
}

export async function createDeck(
  userId: string,
  name: string,
  gameType: string,
  format?: string,
  description?: string,
): Promise<Result<{ id: string }>> {
  try {
    const deck = await prisma.deck.create({
      data: {
        name,
        gameType: gameType as PrismaGameType,
        format: format || null,
        description: description || null,
        userId,
      },
      select: { id: true },
    });
    return { success: true, data: deck };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to create deck") };
  }
}

export async function updateDeck(
  id: string,
  userId: string,
  data: { name?: string; description?: string; format?: string; isPublic?: boolean },
): Promise<Result<{ id: string }>> {
  try {
    const existing = await prisma.deck.findFirst({ where: { id, userId } });
    if (!existing) {
      return { success: false, error: new Error("Deck not found") };
    }
    const deck = await prisma.deck.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.format !== undefined && { format: data.format || null }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
      select: { id: true },
    });
    return { success: true, data: deck };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update deck") };
  }
}

export async function deleteDeck(
  id: string,
  userId: string,
): Promise<Result<void>> {
  try {
    const existing = await prisma.deck.findFirst({ where: { id, userId } });
    if (!existing) {
      return { success: false, error: new Error("Deck not found") };
    }
    await prisma.deck.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to delete deck") };
  }
}

export async function addCardToDeck(
  deckId: string,
  userId: string,
  cardId: string,
  quantity: number,
  isSideboard: boolean,
): Promise<Result<{ id: string }>> {
  try {
    const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
    if (!deck) {
      return { success: false, error: new Error("Deck not found") };
    }
    // Verify card exists and matches game type
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return { success: false, error: new Error("Card not found") };
    }
    if (card.gameType !== deck.gameType) {
      return { success: false, error: new Error(`Card is for ${card.gameType}, but deck is ${deck.gameType}`) };
    }

    const deckCard = await prisma.deckCard.upsert({
      where: { deckId_cardId_isSideboard: { deckId, cardId, isSideboard } },
      create: { deckId, cardId, quantity, isSideboard },
      update: { quantity },
      select: { id: true },
    });
    return { success: true, data: deckCard };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to add card to deck") };
  }
}

export async function removeCardFromDeck(
  deckCardId: string,
  userId: string,
): Promise<Result<void>> {
  try {
    const existing = await prisma.deckCard.findUnique({
      where: { id: deckCardId },
      include: { deck: { select: { userId: true } } },
    });
    if (!existing || existing.deck.userId !== userId) {
      return { success: false, error: new Error("Card not found in deck") };
    }
    await prisma.deckCard.delete({ where: { id: deckCardId } });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to remove card") };
  }
}

export async function copyDeck(
  sourceDeckId: string,
  userId: string,
): Promise<Result<{ id: string }>> {
  try {
    const source = await prisma.deck.findUnique({
      where: { id: sourceDeckId },
      include: { cards: true },
    });
    if (!source) {
      return { success: false, error: new Error("Deck not found") };
    }
    if (source.userId !== userId && !source.isPublic) {
      return { success: false, error: new Error("Deck not found") };
    }

    const newDeck = await prisma.deck.create({
      data: {
        name: `${source.name} (Copy)`,
        description: source.description,
        gameType: source.gameType,
        format: source.format,
        userId,
        cards: {
          create: source.cards.map((c) => ({
            cardId: c.cardId,
            quantity: c.quantity,
            isSideboard: c.isSideboard,
          })),
        },
      },
      select: { id: true },
    });
    return { success: true, data: newDeck };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to copy deck") };
  }
}

export async function getPublicDecks(
  gameType?: string,
  search?: string,
): Promise<Result<Deck[]>> {
  try {
    const where: Record<string, unknown> = { isPublic: true };
    if (gameType) where.gameType = gameType as PrismaGameType;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const decks = await prisma.deck.findMany({
      where,
      include: {
        _count: { select: { cards: true } },
        user: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return {
      success: true,
      data: decks.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        gameType: d.gameType as string as Deck["gameType"],
        format: d.format,
        isPublic: d.isPublic,
        userId: d.userId,
        cardCount: d._count.cards,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch public decks") };
  }
}
