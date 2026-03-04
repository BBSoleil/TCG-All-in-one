"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { deleteCollection as deleteCollectionService } from "@/features/collection/services";

export async function deleteCollection(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const result = await deleteCollectionService(id, session.user.id);
  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/collection");
  return {};
}
