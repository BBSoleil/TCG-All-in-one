"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { toggleProfileVisibility, toggleCollectionVisibility, updateBio } from "../services/profiles";
import { checkAndAwardAchievements } from "../services/achievements";

export async function toggleProfileVisibilityAction(): Promise<{ error?: string; isPublic?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await toggleProfileVisibility(session.user.id);
  if (!result.success) return { error: result.error.message };

  // Check for "public_profile" achievement
  await checkAndAwardAchievements(session.user.id);

  revalidatePath("/profile");
  revalidatePath(`/user/${session.user.id}`);
  return { isPublic: result.data.isPublic };
}

export async function toggleCollectionVisibilityAction(
  collectionId: string,
): Promise<{ error?: string; isPublic?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await toggleCollectionVisibility(collectionId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath(`/collection/${collectionId}`);
  return { isPublic: result.data.isPublic };
}

export async function updateBioAction(
  bio: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  if (bio.length > 500) return { error: "Bio must be 500 characters or less" };

  const result = await updateBio(session.user.id, bio);
  if (!result.success) return { error: result.error.message };

  // Check for "profile_complete" achievement
  await checkAndAwardAchievements(session.user.id);

  revalidatePath("/profile");
  revalidatePath(`/user/${session.user.id}`);
  return {};
}

export async function searchUsersAction(
  query: string,
): Promise<{ error?: string; users?: Array<{ id: string; name: string | null; image: string | null; bio: string | null; followerCount: number; isFollowing: boolean }> }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const { searchUsers } = await import("../services/profiles");
  const result = await searchUsers(query, session.user.id);
  if (!result.success) return { error: result.error.message };

  return { users: result.data };
}
