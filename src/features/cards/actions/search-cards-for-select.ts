"use server";

import { auth } from "@/auth";
import { searchCardsForSelect as searchService, type CardSelectOption } from "@/features/cards/services";

export async function fetchCardsForSelect(
  gameType: string,
  query?: string,
): Promise<CardSelectOption[]> {
  // Auth-gate this — it's invoked from logged-in flows only and we don't want
  // it to be a public-readable lookup endpoint via server-action ID replay.
  const session = await auth();
  if (!session?.user?.id) return [];
  return searchService(gameType, query);
}
