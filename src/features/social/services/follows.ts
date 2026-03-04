import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { FollowState, UserSearchResult } from "../types";

export async function followUser(
  followerId: string,
  followingId: string,
): Promise<Result<void>> {
  try {
    if (followerId === followingId) {
      return { success: false, error: new Error("Cannot follow yourself") };
    }
    const target = await prisma.user.findUnique({
      where: { id: followingId },
      select: { isPublic: true },
    });
    if (!target) {
      return { success: false, error: new Error("User not found") };
    }
    if (!target.isPublic) {
      return { success: false, error: new Error("Cannot follow a private profile") };
    }

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to follow user") };
  }
}

export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<Result<void>> {
  try {
    await prisma.follow.deleteMany({
      where: { followerId, followingId },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to unfollow user") };
  }
}

export async function getFollowState(
  viewerId: string,
  profileUserId: string,
): Promise<Result<FollowState>> {
  try {
    const [isFollowing, followerCount, followingCount] = await Promise.all([
      prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: profileUserId } },
      }),
      prisma.follow.count({ where: { followingId: profileUserId } }),
      prisma.follow.count({ where: { followerId: profileUserId } }),
    ]);
    return {
      success: true,
      data: {
        isFollowing: isFollowing !== null,
        followerCount,
        followingCount,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to get follow state") };
  }
}

export async function getFollowers(
  profileUserId: string,
  viewerId?: string,
): Promise<Result<UserSearchResult[]>> {
  try {
    const follows = await prisma.follow.findMany({
      where: { followingId: profileUserId },
      select: {
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            _count: { select: { followers: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let viewerFollowing = new Set<string>();
    if (viewerId) {
      const vFollows = await prisma.follow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: follows.map((f) => f.follower.id) },
        },
        select: { followingId: true },
      });
      viewerFollowing = new Set(vFollows.map((f) => f.followingId));
    }

    return {
      success: true,
      data: follows.map((f) => ({
        id: f.follower.id,
        name: f.follower.name,
        image: f.follower.image,
        bio: f.follower.bio,
        followerCount: f.follower._count.followers,
        isFollowing: viewerFollowing.has(f.follower.id),
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to get followers") };
  }
}

export async function getFollowing(
  profileUserId: string,
  viewerId?: string,
): Promise<Result<UserSearchResult[]>> {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: profileUserId },
      select: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            _count: { select: { followers: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let viewerFollowing = new Set<string>();
    if (viewerId) {
      const vFollows = await prisma.follow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: follows.map((f) => f.following.id) },
        },
        select: { followingId: true },
      });
      viewerFollowing = new Set(vFollows.map((f) => f.followingId));
    }

    return {
      success: true,
      data: follows.map((f) => ({
        id: f.following.id,
        name: f.following.name,
        image: f.following.image,
        bio: f.following.bio,
        followerCount: f.following._count.followers,
        isFollowing: viewerFollowing.has(f.following.id),
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to get following") };
  }
}
