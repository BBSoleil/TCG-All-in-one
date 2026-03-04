import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { AchievementDefinition, PublicAchievement } from "../types";

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Collection milestones
  { code: "first_card", name: "First Card", description: "Add your first card to a collection", icon: "🃏", category: "collection", threshold: 1 },
  { code: "collector_10", name: "Starter Collector", description: "Own 10 cards across all collections", icon: "📦", category: "collection", threshold: 10 },
  { code: "collector_50", name: "Growing Collection", description: "Own 50 cards across all collections", icon: "🗃️", category: "collection", threshold: 50 },
  { code: "collector_100", name: "Centurion", description: "Own 100 cards across all collections", icon: "💯", category: "collection", threshold: 100 },
  { code: "collector_500", name: "Hoarder", description: "Own 500 cards across all collections", icon: "🏆", category: "collection", threshold: 500 },
  { code: "collector_1000", name: "Grand Collector", description: "Own 1000 cards across all collections", icon: "👑", category: "collection", threshold: 1000 },
  { code: "multi_game", name: "Multi-Game Player", description: "Have collections for 2+ games", icon: "🎮", category: "collection", threshold: 2 },
  { code: "all_games", name: "TCG Master", description: "Have collections for all 4 games", icon: "🌟", category: "collection", threshold: 4 },
  // Social milestones
  { code: "first_follower", name: "Getting Noticed", description: "Gain your first follower", icon: "👋", category: "social", threshold: 1 },
  { code: "followers_10", name: "Popular", description: "Gain 10 followers", icon: "🤝", category: "social", threshold: 10 },
  { code: "followers_50", name: "Influencer", description: "Gain 50 followers", icon: "⭐", category: "social", threshold: 50 },
  { code: "first_follow", name: "Social Butterfly", description: "Follow your first user", icon: "🦋", category: "social", threshold: 1 },
  // Account milestones
  { code: "profile_complete", name: "Identity", description: "Complete your profile with name, image, and bio", icon: "🪪", category: "milestone", threshold: 1 },
  { code: "public_profile", name: "Open Book", description: "Make your profile public", icon: "📖", category: "milestone", threshold: 1 },
];

export async function ensureAchievementsSeeded(): Promise<void> {
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { code: def.code },
      create: {
        code: def.code,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        threshold: def.threshold,
      },
      update: {
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        threshold: def.threshold,
      },
    });
  }
}

export async function checkAndAwardAchievements(
  userId: string,
): Promise<Result<string[]>> {
  try {
    // Ensure all achievement definitions exist in DB
    await ensureAchievementsSeeded();

    const newlyAwarded: string[] = [];

    // Get current stats
    const [totalCards, gameTypes, followerCount, followingCount, user] = await Promise.all([
      prisma.collectionCard.count({ where: { collection: { userId } } }),
      prisma.collection.findMany({
        where: { userId },
        select: { gameType: true },
        distinct: ["gameType"],
      }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true, bio: true, isPublic: true },
      }),
    ]);

    // Get already earned achievements
    const earned = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievement: { select: { code: true } } },
    });
    const earnedCodes = new Set(earned.map((e) => e.achievement.code));

    // Check each achievement
    const checks: { code: string; met: boolean }[] = [
      { code: "first_card", met: totalCards >= 1 },
      { code: "collector_10", met: totalCards >= 10 },
      { code: "collector_50", met: totalCards >= 50 },
      { code: "collector_100", met: totalCards >= 100 },
      { code: "collector_500", met: totalCards >= 500 },
      { code: "collector_1000", met: totalCards >= 1000 },
      { code: "multi_game", met: gameTypes.length >= 2 },
      { code: "all_games", met: gameTypes.length >= 4 },
      { code: "first_follower", met: followerCount >= 1 },
      { code: "followers_10", met: followerCount >= 10 },
      { code: "followers_50", met: followerCount >= 50 },
      { code: "first_follow", met: followingCount >= 1 },
      { code: "profile_complete", met: !!(user?.name && user?.image && user?.bio) },
      { code: "public_profile", met: !!user?.isPublic },
    ];

    for (const check of checks) {
      if (check.met && !earnedCodes.has(check.code)) {
        const achievement = await prisma.achievement.findUnique({
          where: { code: check.code },
        });
        if (achievement) {
          await prisma.userAchievement.create({
            data: { userId, achievementId: achievement.id },
          });
          newlyAwarded.push(check.code);
        }
      }
    }

    return { success: true, data: newlyAwarded };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to check achievements") };
  }
}

export async function getUserAchievements(
  userId: string,
): Promise<Result<PublicAchievement[]>> {
  try {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
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
    });

    return {
      success: true,
      data: achievements.map((ua) => ({
        code: ua.achievement.code,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        category: ua.achievement.category,
        earnedAt: ua.earnedAt,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch achievements") };
  }
}
