"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createDeck,
  updateDeck,
  deleteDeck,
  addCardToDeck,
  removeCardFromDeck,
  copyDeck,
  getDeckById,
  getUserDecks,
} from "../services/decks";
import { getFormatById, validateDeck } from "../services/formats";
import { analyzeDeck } from "../services/analysis";
import type { DeckAnalysis, DeckValidationResult } from "../types";
import { createDeckSchema, addCardToDeckSchema } from "../types/schemas";

export async function createDeckAction(
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = createDeckSchema.safeParse({
    name: formData.get("name"),
    gameType: formData.get("gameType"),
    format: formData.get("format") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createDeck(session.user.id, parsed.data.name, parsed.data.gameType, parsed.data.format, parsed.data.description);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/decks");
  return { id: result.data.id };
}

export async function updateDeckAction(
  deckId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const name = formData.get("name") as string | null;
  const description = formData.get("description") as string | null;
  const format = formData.get("format") as string | null;
  const isPublicStr = formData.get("isPublic") as string | null;

  const data: { name?: string; description?: string; format?: string; isPublic?: boolean } = {};
  if (name !== null) data.name = name.trim();
  if (description !== null) data.description = description;
  if (format !== null) data.format = format;
  if (isPublicStr !== null) data.isPublic = isPublicStr === "true";

  const result = await updateDeck(deckId, session.user.id, data);
  if (!result.success) return { error: result.error.message };

  revalidatePath(`/decks/${deckId}`);
  revalidatePath("/decks");
  return {};
}

export async function deleteDeckAction(deckId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await deleteDeck(deckId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/decks");
  return {};
}

export async function addCardToDeckAction(
  deckId: string,
  cardId: string,
  quantity: number,
  isSideboard: boolean,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = addCardToDeckSchema.safeParse({ deckId, cardId, quantity, isSideboard });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await addCardToDeck(parsed.data.deckId, session.user.id, parsed.data.cardId, parsed.data.quantity, parsed.data.isSideboard);
  if (!result.success) return { error: result.error.message };

  revalidatePath(`/decks/${parsed.data.deckId}`);
  return {};
}

export async function removeCardFromDeckAction(
  deckCardId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await removeCardFromDeck(deckCardId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/decks");
  return {};
}

export async function copyDeckAction(deckId: string): Promise<{ error?: string; id?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await copyDeck(deckId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/decks");
  return { id: result.data.id };
}

export async function validateDeckAction(
  deckId: string,
): Promise<{ error?: string; validation?: DeckValidationResult }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const deckResult = await getDeckById(deckId, session.user.id);
  if (!deckResult.success) return { error: deckResult.error.message };

  const deck = deckResult.data;
  const format = deck.format ? getFormatById(deck.format) ?? null : null;

  const validation = validateDeck(
    deck.cards.map((dc) => ({
      cardId: dc.card.id,
      cardName: dc.card.name,
      quantity: dc.quantity,
      isSideboard: dc.isSideboard,
    })),
    format,
  );

  return { validation };
}

export async function analyzeDeckAction(
  deckId: string,
): Promise<{ error?: string; analysis?: DeckAnalysis }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // Verify access
  const deckResult = await getDeckById(deckId, session.user.id);
  if (!deckResult.success) return { error: deckResult.error.message };

  const analysisResult = await analyzeDeck(deckId);
  if (!analysisResult.success) return { error: analysisResult.error.message };

  return { analysis: analysisResult.data };
}

export async function getUserDecksAction(): Promise<
  { id: string; name: string; gameType: string }[]
> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const result = await getUserDecks(session.user.id);
  if (!result.success) return [];

  return result.data.map((d) => ({ id: d.id, name: d.name, gameType: d.gameType }));
}

export async function fetchCardsForDeck(
  gameType: string,
  search: string,
): Promise<{ id: string; name: string; setName: string | null; imageUrl: string | null }[]> {
  const { prisma } = await import("@/shared/lib/prisma");
  const cards = await prisma.card.findMany({
    where: {
      gameType: gameType as Parameters<typeof prisma.card.findMany>[0] extends { where?: { gameType?: infer G } } ? G : never,
      name: { contains: search, mode: "insensitive" },
    },
    select: { id: true, name: true, setName: true, imageUrl: true },
    orderBy: { name: "asc" },
    take: 20,
  });
  return cards;
}
