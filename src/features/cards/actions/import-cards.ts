"use server";

import { auth } from "@/auth";
import { rateLimit, RATE_LIMITS } from "@/shared/lib/rate-limit";
import { importPokemonCards, fetchPokemonSets } from "@/features/cards/services/import-pokemon";
import { importYugiohCards, fetchYugiohSets } from "@/features/cards/services/import-yugioh";
import { importMtgCards, fetchMtgSets } from "@/features/cards/services/import-mtg";
import {
  importOnePieceCards,
  importOnePieceStarterDecks,
  fetchOnePieceSets,
} from "@/features/cards/services/import-onepiece";
import { revalidatePath } from "next/cache";

interface ImportResult {
  error?: string;
  imported?: number;
  hasMore?: boolean;
}

export async function importPokemon(setId: string): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const rl = rateLimit(`${session.user.id}:importCards`, RATE_LIMITS.importCards);
  if (!rl.success) return { error: "Too many import requests. Please try again later." };

  const result = await importPokemonCards(setId);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/cards");
  return { imported: result.data.imported };
}

export async function importYugioh(offset: number, setName?: string): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const rl = rateLimit(`${session.user.id}:importCards`, RATE_LIMITS.importCards);
  if (!rl.success) return { error: "Too many import requests. Please try again later." };

  const result = await importYugiohCards(offset, 50, setName);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/cards");
  return { imported: result.data.imported, hasMore: result.data.hasMore };
}

export async function getYugiohSets(): Promise<
  { set_name: string; set_code: string; num_of_cards: number }[]
> {
  const result = await fetchYugiohSets();
  return result.success
    ? result.data.map((s) => ({ set_name: s.set_name, set_code: s.set_code, num_of_cards: s.num_of_cards }))
    : [];
}

export async function importMtg(setCode: string): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const rl = rateLimit(`${session.user.id}:importCards`, RATE_LIMITS.importCards);
  if (!rl.success) return { error: "Too many import requests. Please try again later." };

  const result = await importMtgCards(setCode);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/cards");
  return { imported: result.data.imported };
}

export async function getPokemonSets(): Promise<
  { id: string; name: string; total: number }[]
> {
  const result = await fetchPokemonSets();
  return result.success ? result.data : [];
}

export async function getMtgSets(): Promise<
  { code: string; name: string; card_count: number }[]
> {
  const result = await fetchMtgSets();
  return result.success ? result.data : [];
}

export async function importOnePiece(setId: string): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const rl = rateLimit(`${session.user.id}:importCards`, RATE_LIMITS.importCards);
  if (!rl.success) return { error: "Too many import requests. Please try again later." };

  const result = await importOnePieceCards(setId);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/cards");
  return { imported: result.data.imported };
}

export async function importOnePieceStarters(): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await importOnePieceStarterDecks();
  if (!result.success) return { error: result.error.message };

  revalidatePath("/cards");
  return { imported: result.data.imported };
}

export async function getOnePieceSets(): Promise<
  { id: string; name: string }[]
> {
  const result = await fetchOnePieceSets();
  return result.success ? result.data : [];
}
