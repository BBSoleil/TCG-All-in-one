"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { removeFromWishlist as removeService } from "@/features/wishlist/services";

export async function removeFromWishlist(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const result = await removeService(id, session.user.id);
  if (!result.success) {
    return { error: result.error.message };
  }

  revalidatePath("/wishlist");
  return {};
}
