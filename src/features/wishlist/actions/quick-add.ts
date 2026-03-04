"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";

export async function quickAddToWishlist(
  cardId: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    await prisma.wishlistCard.upsert({
      where: {
        userId_cardId: { userId: session.user.id, cardId },
      },
      create: { userId: session.user.id, cardId },
      update: {},
    });
    revalidatePath("/wishlist");
    return { success: true };
  } catch {
    return { error: "Failed to add to wishlist" };
  }
}
