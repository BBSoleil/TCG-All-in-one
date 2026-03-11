import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { PublicProfile, PublicCollection, UserSearchResult } from "../types";

export async function getPublicProfile(
  profileUserId: string,
  viewerUserId?: string,
): Promise<Result<PublicProfile>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        isPublic: true,
        createdAt: true,
        _count: {
          select: {
            collections: true,
            followers: true,
            following: true,
          },
        },
        achievements: {
          select: {
            earnedAt: true,
            achievement: {
              select: {
                code: true,
                name: true,
                description: true,
                icon: true,
                category: true,
              },
            },
          },
          orderBy: { earnedAt: "desc" },
        },
      },
    });

    if (!user) {
      return { success: false, error: new Error("User not found") };
    }

    // Only allow viewing if profile is public or viewer is the owner
    if (!user.isPublic && viewerUserId !== profileUserId) {
      return { success: false, error: new Error("Profile is private") };
    }

    // Count total cards across all collections
    const totalCards = await prisma.collectionCard.count({
      where: { collection: { userId: profileUserId } },
    });

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        image: user.image,
        bio: user.bio,
        isPublic: user.isPublic,
        collectionCount: user._count.collections,
        totalCards,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        achievements: user.achievements.map((ua) => ({
          code: ua.achievement.code,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          category: ua.achievement.category,
          earnedAt: ua.earnedAt,
        })),
        joinedAt: user.createdAt,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch profile") };
  }
}

export async function getPublicCollections(
  profileUserId: string,
  viewerUserId?: string,
): Promise<Result<PublicCollection[]>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: { isPublic: true },
    });
    if (!user) {
      return { success: false, error: new Error("User not found") };
    }
    if (!user.isPublic && viewerUserId !== profileUserId) {
      return { success: false, error: new Error("Profile is private") };
    }

    // Show only public collections (or all if owner)
    const where = viewerUserId === profileUserId
      ? { userId: profileUserId }
      : { userId: profileUserId, isPublic: true };

    const collections = await prisma.collection.findMany({
      where,
      select: {
        id: true,
        name: true,
        gameType: true,
        updatedAt: true,
        _count: { select: { cards: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return {
      success: true,
      data: collections.map((c) => ({
        id: c.id,
        name: c.name,
        gameType: c.gameType,
        cardCount: c._count.cards,
        updatedAt: c.updatedAt,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch collections") };
  }
}

export async function searchUsers(
  query: string,
  viewerUserId?: string,
): Promise<Result<UserSearchResult[]>> {
  try {
    const users = await prisma.user.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        _count: { select: { followers: true } },
      },
      take: 20,
      orderBy: { name: "asc" },
    });

    // Check follow state for each user if viewer is logged in
    let followingSet = new Set<string>();
    if (viewerUserId) {
      const follows = await prisma.follow.findMany({
        where: {
          followerId: viewerUserId,
          followingId: { in: users.map((u) => u.id) },
        },
        select: { followingId: true },
      });
      followingSet = new Set(follows.map((f) => f.followingId));
    }

    return {
      success: true,
      data: users
        .filter((u) => u.id !== viewerUserId)
        .map((u) => ({
          id: u.id,
          name: u.name,
          image: u.image,
          bio: u.bio,
          followerCount: u._count.followers,
          isFollowing: followingSet.has(u.id),
        })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to search users") };
  }
}

export async function toggleProfileVisibility(
  userId: string,
): Promise<Result<{ isPublic: boolean }>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPublic: true },
    });
    if (!user) {
      return { success: false, error: new Error("User not found") };
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isPublic: !user.isPublic },
      select: { isPublic: true },
    });
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update visibility") };
  }
}

export async function toggleCollectionVisibility(
  collectionId: string,
  userId: string,
): Promise<Result<{ isPublic: boolean }>> {
  try {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, userId },
      select: { isPublic: true },
    });
    if (!collection) {
      return { success: false, error: new Error("Collection not found") };
    }
    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: { isPublic: !collection.isPublic },
      select: { isPublic: true },
    });
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update visibility") };
  }
}

export async function updateBio(
  userId: string,
  bio: string,
): Promise<Result<{ bio: string | null }>> {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { bio: bio.trim() || null },
      select: { bio: true },
    });
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to update bio") };
  }
}

