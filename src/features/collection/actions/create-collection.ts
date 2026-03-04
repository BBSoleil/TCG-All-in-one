"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createCollectionSchema } from "@/features/collection/schemas";
import { createCollection as createCollectionService } from "@/features/collection/services";
import type { CollectionActionState } from "@/features/collection/types";

export async function createCollection(
  _prev: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const raw = {
    name: formData.get("name"),
    gameType: formData.get("gameType"),
  };

  const parsed = createCollectionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const result = await createCollectionService(
    session.user.id,
    parsed.data.name,
    parsed.data.gameType,
  );

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/collection");
  return { success: true };
}
