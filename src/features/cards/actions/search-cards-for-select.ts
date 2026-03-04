"use server";

import { searchCardsForSelect as searchService } from "@/features/cards/services";

export async function fetchCardsForSelect(
  gameType: string,
): Promise<{ id: string; name: string }[]> {
  return searchService(gameType);
}
