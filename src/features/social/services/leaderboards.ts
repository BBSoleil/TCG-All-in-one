import { prisma } from "@/shared/lib/prisma";
import { cached } from "@/shared/lib/cache";
import type { Result } from "@/shared/types";
import type { LeaderboardCategory, LeaderboardEntry } from "../types";

const LIMIT = 25;

async function getLeaderboardUncached(
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

export const getLeaderboard = cached(getLeaderboardUncached, ["leaderboards"], { revalidate: 300 });

async function portfolioLeaderboard(): Promise<LeaderboardEntry[]> {
  // Single aggregated query instead of N+1 fetching all users + their collections
  const rows = await prisma.$queryRawUnsafe<
    { id: string; name: string | null; image: string | null; value: number }[]
  >(`
    SELECT u.id, u.name, u.image,
           COALESCE(SUM(cc.quantity * c."marketPrice"), 0)::float as value
    FROM "users" u
    JOIN "collections" col ON col."userId" = u.id
    JOIN "collection_cards" cc ON cc."collectionId" = col.id
    JOIN "cards" c ON c.id = cc."cardId"
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
  const rows = await prisma.$queryRawUnsafe<
    { id: string; name: string | null; image: string | null; value: number }[]
  >(`
    SELECT u.id, u.name, u.image,
           COALESCE(SUM(cc.quantity), 0)::int as value
    FROM "users" u
    JOIN "collections" col ON col."userId" = u.id
    JOIN "collection_cards" cc ON cc."collectionId" = col.id
    WHERE u."isPublic" = true
    GROUP BY u.id
    HAVING SUM(cc.quantity) > 0
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
  const rows = await prisma.$queryRawUnsafe<
    { id: string; name: string | null; image: string | null; value: number }[]
  >(`
    SELECT u.id, u.name, u.image,
           (COALESCE(s.cnt, 0) + COALESCE(b.cnt, 0))::int as value
    FROM "users" u
    LEFT JOIN (
      SELECT "sellerId", COUNT(*)::int as cnt FROM "transactions" GROUP BY "sellerId"
    ) s ON s."sellerId" = u.id
    LEFT JOIN (
      SELECT "buyerId", COUNT(*)::int as cnt FROM "transactions" GROUP BY "buyerId"
    ) b ON b."buyerId" = u.id
    WHERE u."isPublic" = true
      AND (COALESCE(s.cnt, 0) + COALESCE(b.cnt, 0)) > 0
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
