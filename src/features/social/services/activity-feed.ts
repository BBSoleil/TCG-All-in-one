import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export interface ActivityEvent {
  id: string;
  type: "card_added" | "new_listing" | "trade_completed" | "achievement_earned" | "new_follower";
  actorId: string;
  actorName: string;
  actorImage: string | null;
  description: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export async function getActivityFeed(
  userId: string,
  limit = 20,
): Promise<Result<ActivityEvent[]>> {
  try {
    // Get followed user IDs
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedIds = [userId, ...follows.map((f) => f.followingId)];

    // Parallel fetch recent events from existing tables
    const [recentCards, recentListings, recentAchievements, recentFollows] = await Promise.all([
      // Recent cards added by followed users (from public collections)
      prisma.collectionCard.findMany({
        where: {
          collection: {
            userId: { in: followedIds },
            isPublic: true,
          },
        },
        include: {
          card: { select: { id: true, name: true, gameType: true } },
          collection: {
            select: {
              name: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
        orderBy: { addedAt: "desc" },
        take: limit,
      }),

      // Recent listings
      prisma.listing.findMany({
        where: { userId: { in: followedIds }, status: "ACTIVE" },
        include: {
          card: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // Recent achievements
      prisma.userAchievement.findMany({
        where: { userId: { in: followedIds } },
        include: {
          user: { select: { id: true, name: true, image: true } },
          achievement: { select: { name: true, description: true, icon: true } },
        },
        orderBy: { earnedAt: "desc" },
        take: limit,
      }),

      // Recent follows (new followers of current user or followed users following others)
      prisma.follow.findMany({
        where: { followerId: { in: followedIds } },
        include: {
          follower: { select: { id: true, name: true, image: true } },
          following: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const events: ActivityEvent[] = [];

    // Map collection card additions
    for (const cc of recentCards) {
      events.push({
        id: `card-${cc.id}`,
        type: "card_added",
        actorId: cc.collection.user.id,
        actorName: cc.collection.user.name ?? "Unknown",
        actorImage: cc.collection.user.image,
        description: `added ${cc.card.name} to ${cc.collection.name}`,
        metadata: { cardId: cc.card.id, gameType: cc.card.gameType },
        createdAt: cc.addedAt.toISOString(),
      });
    }

    // Map listings
    for (const listing of recentListings) {
      events.push({
        id: `listing-${listing.id}`,
        type: "new_listing",
        actorId: listing.user.id,
        actorName: listing.user.name ?? "Unknown",
        actorImage: listing.user.image,
        description: `listed ${listing.card.name} for $${Number(listing.price).toFixed(2)}`,
        metadata: { listingId: listing.id, cardId: listing.card.id },
        createdAt: listing.createdAt.toISOString(),
      });
    }

    // Map achievements
    for (const ua of recentAchievements) {
      events.push({
        id: `achievement-${ua.id}`,
        type: "achievement_earned",
        actorId: ua.user.id,
        actorName: ua.user.name ?? "Unknown",
        actorImage: ua.user.image,
        description: `earned "${ua.achievement.name}" — ${ua.achievement.description}`,
        metadata: { icon: ua.achievement.icon },
        createdAt: ua.earnedAt.toISOString(),
      });
    }

    // Map follows
    for (const follow of recentFollows) {
      events.push({
        id: `follow-${follow.id}`,
        type: "new_follower",
        actorId: follow.follower.id,
        actorName: follow.follower.name ?? "Unknown",
        actorImage: follow.follower.image,
        description: `started following ${follow.following.name ?? "a collector"}`,
        metadata: { followingId: follow.following.id },
        createdAt: follow.createdAt.toISOString(),
      });
    }

    // Sort by date descending and take limit
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: events.slice(0, limit) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch activity feed") };
  }
}
