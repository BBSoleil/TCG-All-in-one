"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { rateLimit, RATE_LIMITS } from "@/shared/lib/rate-limit";
import { followUser, unfollowUser } from "../services/follows";
import { checkAndAwardAchievements } from "../services/achievements";
import { followSchema } from "../types/schemas";

export async function followAction(followingId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = followSchema.safeParse({ followingId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const rl = rateLimit(`${session.user.id}:followUser`, RATE_LIMITS.followUser);
  if (!rl.success) return { error: "Too many requests. Please try again later." };

  const result = await followUser(session.user.id, parsed.data.followingId);
  if (!result.success) return { error: result.error.message };

  await checkAndAwardAchievements(session.user.id);

  revalidatePath(`/user/${parsed.data.followingId}`);
  revalidatePath("/social");
  return {};
}

export async function unfollowAction(followingId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = followSchema.safeParse({ followingId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await unfollowUser(session.user.id, parsed.data.followingId);
  if (!result.success) return { error: result.error.message };

  revalidatePath(`/user/${parsed.data.followingId}`);
  revalidatePath("/social");
  return {};
}
