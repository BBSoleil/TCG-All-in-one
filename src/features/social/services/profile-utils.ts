import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export async function getOwnProfile(
  userId: string,
): Promise<Result<{ isPublic: boolean; bio: string | null }>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPublic: true, bio: true },
    });
    if (!user) {
      return { success: false, error: new Error("User not found") };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch profile") };
  }
}

export async function getUserName(
  userId: string,
): Promise<Result<string>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return { success: true, data: user?.name ?? "Collector" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch user") };
  }
}

export async function getUserOgData(
  userId: string,
): Promise<Result<{
  name: string | null;
  image: string | null;
  bio: string | null;
  collectionCount: number;
  followerCount: number;
  achievementCount: number;
}>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        image: true,
        bio: true,
        _count: {
          select: {
            collections: true,
            followers: true,
            achievements: true,
          },
        },
      },
    });
    if (!user) {
      return { success: false, error: new Error("User not found") };
    }
    return {
      success: true,
      data: {
        name: user.name,
        image: user.image,
        bio: user.bio,
        collectionCount: user._count.collections,
        followerCount: user._count.followers,
        achievementCount: user._count.achievements,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch user") };
  }
}
