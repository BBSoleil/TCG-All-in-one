"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { updateCollectionCardFlags } from "@/features/collection/services";

export async function toggleCardFlags(
  cardId: string,
  collectionId: string,
  flags: { forSale?: boolean; forTrade?: boolean },
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const result = await updateCollectionCardFlags(cardId, session.user.id, flags);
  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath(`/collection/${collectionId}`);
  return {};
}
