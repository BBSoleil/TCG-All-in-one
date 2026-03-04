import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import {
  followUser,
  unfollowUser,
  getFollowState,
} from "@/features/social/services/follows";
import {
  checkAndAwardAchievements,
} from "@/features/social/services/achievements";

describe("followUser", () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.follow.upsert.mockReset();
  });

  it("follows a public user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ isPublic: true });
    mockPrisma.follow.upsert.mockResolvedValue({ id: "follow-1" });

    const result = await followUser("user-1", "user-2");

    expect(result.success).toBe(true);
    expect(mockPrisma.follow.upsert).toHaveBeenCalledWith({
      where: { followerId_followingId: { followerId: "user-1", followingId: "user-2" } },
      create: { followerId: "user-1", followingId: "user-2" },
      update: {},
    });
  });

  it("rejects self-follow", async () => {
    const result = await followUser("user-1", "user-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Cannot follow yourself");
    }
  });

  it("rejects following a private profile", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ isPublic: false });

    const result = await followUser("user-1", "private-user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Cannot follow a private profile");
    }
  });

  it("rejects following a nonexistent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await followUser("user-1", "ghost");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("User not found");
    }
  });
});

describe("unfollowUser", () => {
  beforeEach(() => {
    mockPrisma.follow.deleteMany.mockReset();
  });

  it("unfollows successfully", async () => {
    mockPrisma.follow.deleteMany.mockResolvedValue({ count: 1 });

    const result = await unfollowUser("user-1", "user-2");

    expect(result.success).toBe(true);
    expect(mockPrisma.follow.deleteMany).toHaveBeenCalledWith({
      where: { followerId: "user-1", followingId: "user-2" },
    });
  });

  it("succeeds even if not following (no-op)", async () => {
    mockPrisma.follow.deleteMany.mockResolvedValue({ count: 0 });

    const result = await unfollowUser("user-1", "user-2");

    expect(result.success).toBe(true);
  });
});

describe("getFollowState", () => {
  beforeEach(() => {
    mockPrisma.follow.findUnique.mockReset();
    mockPrisma.follow.count.mockReset();
  });

  it("returns follow state for user", async () => {
    mockPrisma.follow.findUnique.mockResolvedValue({ id: "follow-1" });
    mockPrisma.follow.count
      .mockResolvedValueOnce(10) // followerCount
      .mockResolvedValueOnce(5); // followingCount

    const result = await getFollowState("viewer", "profile-user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFollowing).toBe(true);
      expect(result.data.followerCount).toBe(10);
      expect(result.data.followingCount).toBe(5);
    }
  });

  it("returns not following when no follow record", async () => {
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    mockPrisma.follow.count.mockResolvedValue(0);

    const result = await getFollowState("viewer", "profile-user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFollowing).toBe(false);
    }
  });
});

describe("checkAndAwardAchievements", () => {
  beforeEach(() => {
    // Reset all mocks used by achievements
    mockPrisma.achievement.upsert.mockReset();
    mockPrisma.achievement.findUnique.mockReset();
    mockPrisma.collectionCard.count.mockReset();
    mockPrisma.collection.findMany.mockReset();
    mockPrisma.follow.count.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.userAchievement.findMany.mockReset();
    mockPrisma.userAchievement.create.mockReset();
  });

  it("awards first_card when user has 1+ cards", async () => {
    // Seed mock
    mockPrisma.achievement.upsert.mockResolvedValue({ id: "ach-id" });

    // Stats
    mockPrisma.collectionCard.count.mockResolvedValue(5);
    mockPrisma.collection.findMany.mockResolvedValue([{ gameType: "POKEMON" }]);
    mockPrisma.follow.count.mockResolvedValue(0); // both calls
    mockPrisma.user.findUnique.mockResolvedValue({
      name: null,
      image: null,
      bio: null,
      isPublic: false,
    });

    // No existing achievements
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    // Achievement lookup for awarding
    mockPrisma.achievement.findUnique.mockResolvedValue({ id: "ach-first-card" });
    mockPrisma.userAchievement.create.mockResolvedValue({ id: "ua-1" });

    const result = await checkAndAwardAchievements("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain("first_card");
    }
  });

  it("does not re-award already earned achievements", async () => {
    mockPrisma.achievement.upsert.mockResolvedValue({ id: "ach-id" });
    mockPrisma.collectionCard.count.mockResolvedValue(5);
    mockPrisma.collection.findMany.mockResolvedValue([{ gameType: "POKEMON" }]);
    mockPrisma.follow.count.mockResolvedValue(0);
    mockPrisma.user.findUnique.mockResolvedValue({
      name: null,
      image: null,
      bio: null,
      isPublic: false,
    });

    // Already earned first_card
    mockPrisma.userAchievement.findMany.mockResolvedValue([
      { achievement: { code: "first_card" } },
    ]);

    const result = await checkAndAwardAchievements("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toContain("first_card");
    }
  });

  it("awards public_profile when user is public", async () => {
    mockPrisma.achievement.upsert.mockResolvedValue({ id: "ach-id" });
    mockPrisma.collectionCard.count.mockResolvedValue(0);
    mockPrisma.collection.findMany.mockResolvedValue([]);
    mockPrisma.follow.count.mockResolvedValue(0);
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ash",
      image: null,
      bio: null,
      isPublic: true,
    });
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);
    mockPrisma.achievement.findUnique.mockResolvedValue({ id: "ach-public" });
    mockPrisma.userAchievement.create.mockResolvedValue({ id: "ua-2" });

    const result = await checkAndAwardAchievements("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain("public_profile");
    }
  });
});
