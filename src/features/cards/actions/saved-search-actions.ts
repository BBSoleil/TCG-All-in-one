"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createSavedSearch,
  deleteSavedSearch,
} from "../services/saved-searches";

export async function saveSearchAction(
  name: string,
  filters: string,
): Promise<{ error?: string; id?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  if (!name.trim()) return { error: "Name is required" };
  if (name.length > 100) return { error: "Name must be 100 characters or less" };

  const result = await createSavedSearch(session.user.id, name.trim(), filters);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/cards");
  return { id: result.data.id };
}

export async function deleteSavedSearchAction(
  id: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await deleteSavedSearch(id, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/cards");
  return {};
}
