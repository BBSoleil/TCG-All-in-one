"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { removeCardFromCollection } from "@/features/collection/services";

export async function removeCard(
  id: string,
  collectionId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const result = await removeCardFromCollection(id, session.user.id);
  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath(`/collection/${collectionId}`);
  revalidatePath("/leaderboards");
  return {};
}
