import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { LeaderboardCategory, LeaderboardEntry } from "../types";

const LIMIT = 25;

export async function getLeaderboard(
  category: LeaderboardCategory,
): Promise<Result<LeaderboardEntry[]>> {
  try {
    switch (category) {
      case "portfolio":
        return { success: true, data: await portfolioLeaderboard() };
      case "cards":
        return { success: true, data: await cardsLeaderboard() };
      case "followers":
        return { success: true, data: await followersLeaderboard() };
      case "achievements":
        return { success: true, data: await achievementsLeaderboard() };
      case "trades":
        return { success: true, data: await tradesLeaderboard() };
      default:
        return { success: false, error: new Error("Invalid category") };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Leaderboard query failed"),
    };
  }
}

async function portfolioLeaderboard(): Promise<LeaderboardEntry[]> {
  // Single aggregated query instead of N+1 fetching all users + their collections
  const rows = await prisma.$queryRawUnsafe<
    { id: string; name: string | null; image: string | null; value: number }[]
  >(`
    SELECT u.id, u.name, u.image,
           COALESCE(SUM(cc.quantity * c."marketPrice"), 0)::float as value
    FROM "User" u
    JOIN "Collection" col ON col."userId" = u.id
    JOIN "CollectionCard" cc ON cc."collectionId" = col.id
    JOIN "Card" c ON c.id = cc."cardId"
    WHERE u."isPublic" = true AND c."marketPrice" IS NOT NULL
    GROUP BY u.id
    HAVING SUM(cc.quantity * c."marketPrice") > 0
    ORDER BY value DESC
    LIMIT ${LIMIT}
  `);

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.id,
    userName: r.name,
    userImage: r.image,
    value: Number(r.value),
  }));
}

async function cardsLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      name: true,
      image: true,
      collections: {
        select: {
          cards: { select: { quantity: true } },
        },
      },
    },
  });

  const ranked = users
    .map((u) => {
      const value = u.collections.reduce(
        (sum, col) => sum + col.cards.reduce((s, cc) => s + cc.quantity, 0),
        0,
      );
      return { userId: u.id, userName: u.name, userImage: u.image, value };
    })
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, LIMIT);

  return ranked.map((e, i) => ({ ...e, rank: i + 1 }));
}

async function followersLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      name: true,
      image: true,
      _count: { select: { followers: true } },
    },
    orderBy: { followers: { _count: "desc" } },
    take: LIMIT,
  });

  return users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    userName: u.name,
    userImage: u.image,
    value: u._count.followers,
  }));
}

async function achievementsLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      name: true,
      image: true,
      _count: { select: { achievements: true } },
    },
    orderBy: { achievements: { _count: "desc" } },
    take: LIMIT,
  });

  return users
    .filter((u) => u._count.achievements > 0)
    .map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      userName: u.name,
      userImage: u.image,
      value: u._count.achievements,
    }));
}

async function tradesLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      name: true,
      image: true,
      _count: { select: { salesMade: true, purchases: true } },
    },
  });

  const ranked = users
    .map((u) => ({
      userId: u.id,
      userName: u.name,
      userImage: u.image,
      value: u._count.salesMade + u._count.purchases,
    }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, LIMIT);

  return ranked.map((e, i) => ({ ...e, rank: i + 1 }));
}
