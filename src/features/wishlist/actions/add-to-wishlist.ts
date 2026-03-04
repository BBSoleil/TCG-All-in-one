"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { addToWishlistSchema } from "@/features/wishlist/schemas";
import { addToWishlist as addService } from "@/features/wishlist/services";
import type { WishlistActionState } from "@/features/wishlist/types";

export async function addToWishlist(
  _prev: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const raw = {
    cardId: formData.get("cardId"),
    targetPrice: formData.get("targetPrice") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const parsed = addToWishlistSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] = fieldErrors[key] ?? [];
      fieldErrors[key].push(issue.message);
    }
    return { fieldErrors };
  }

  const result = await addService(
    session.user.id,
    parsed.data.cardId,
    parsed.data.targetPrice,
    parsed.data.notes,
  );

  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/wishlist");
  return { success: true };
}
