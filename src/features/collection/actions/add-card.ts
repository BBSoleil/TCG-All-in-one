"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { addCardSchema } from "@/features/collection/schemas";
import { addCardToCollection } from "@/features/collection/services";
import type { CollectionActionState } from "@/features/collection/types";

export async function addCard(
  _prev: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const raw = {
    collectionId: formData.get("collectionId"),
    cardId: formData.get("cardId"),
    quantity: formData.get("quantity"),
    condition: formData.get("condition") || undefined,
    language: formData.get("language") || undefined,
    foil: formData.get("foil") || undefined,
    notes: formData.get("notes") || undefined,
    acquiredPrice: formData.get("acquiredPrice") || undefined,
    acquiredAt: formData.get("acquiredAt") || undefined,
  };

  const parsed = addCardSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const result = await addCardToCollection(
    parsed.data.collectionId,
    session.user.id,
    parsed.data.cardId,
    parsed.data.quantity,
    parsed.data.condition,
    parsed.data.notes,
    parsed.data.language,
    parsed.data.foil,
    parsed.data.acquiredPrice,
    parsed.data.acquiredAt,
  );

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath(`/collection/${parsed.data.collectionId}`);
  revalidatePath("/leaderboards");
  return { success: true };
}
