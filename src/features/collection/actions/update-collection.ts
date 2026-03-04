"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { updateCollectionSchema } from "@/features/collection/schemas";
import { updateCollection as updateCollectionService } from "@/features/collection/services";
import type { CollectionActionState } from "@/features/collection/types";

export async function updateCollection(
  _prev: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const raw = {
    id: formData.get("id"),
    name: formData.get("name"),
  };

  const parsed = updateCollectionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const result = await updateCollectionService(
    parsed.data.id,
    session.user.id,
    parsed.data.name,
  );

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/collection");
  return { success: true };
}
