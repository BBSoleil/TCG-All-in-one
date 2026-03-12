import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { getActivityFeed } from "@/features/social/services/activity-feed";

const NOW = new Date("2026-03-12T12:00:00Z");
const HOUR_AGO = new Date("2026-03-12T11:00:00Z");
const TWO_HOURS_AGO = new Date("2026-03-12T10:00:00Z");

function mockUser(id: string, name: string | null = "TestUser") {
  return { id, name, image: null };
}

describe("getActivityFeed", () => {
  beforeEach(() => {
    mockPrisma.follow.findMany.mockReset();
    mockPrisma.collectionCard.findMany.mockReset();
    mockPrisma.listing.findMany.mockReset();
    mockPrisma.userAchievement.findMany.mockReset();
  });

  it("includes self in followed IDs", async () => {
    mockPrisma.follow.findMany.mockResolvedValue([]);
    mockPrisma.collectionCard.findMany.mockResolvedValue([]);
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    await getActivityFeed("user-1");

    // collectionCard query should include userId = user-1
    const ccCall = mockPrisma.collectionCard.findMany.mock.calls[0]?.[0];
    expect(ccCall?.where?.collection?.userId?.in).toContain("user-1");
  });

  it("includes followed users in query", async () => {
    mockPrisma.follow.findMany.mockResolvedValue([
      { followingId: "user-2" },
      { followingId: "user-3" },
    ]);
    mockPrisma.collectionCard.findMany.mockResolvedValue([]);
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    await getActivityFeed("user-1");

    const ccCall = mockPrisma.collectionCard.findMany.mock.calls[0]?.[0];
    expect(ccCall?.where?.collection?.userId?.in).toEqual(["user-1", "user-2", "user-3"]);
  });

  it("maps card_added events correctly", async () => {
    mockPrisma.follow.findMany.mockResolvedValue([]);
    mockPrisma.collectionCard.findMany.mockResolvedValue([
      {
        id: "cc-1",
        addedAt: NOW,
        card: { id: "card-1", name: "Charizard", gameType: "POKEMON" },
        collection: { name: "My Collection", user: mockUser("user-1") },
      },
    ]);
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const result = await getActivityFeed("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe("card_added");
      expect(result.data[0].description).toContain("Charizard");
      expect(result.data[0].description).toContain("My Collection");
      expect(result.data[0].metadata.cardId).toBe("card-1");
    }
  });

  it("maps new_listing events correctly", async () => {
    mockPrisma.follow.findMany.mockResolvedValue([]);
    mockPrisma.collectionCard.findMany.mockResolvedValue([]);
    mockPrisma.listing.findMany.mockResolvedValue([
      {
        id: "listing-1",
        createdAt: NOW,
        price: 25.5,
        card: { id: "card-1", name: "Pikachu" },
        user: mockUser("user-1", "Ash"),
      },
    ]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const result = await getActivityFeed("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].type).toBe("new_listing");
      expect(result.data[0].description).toContain("Pikachu");
      expect(result.data[0].description).toContain("$25.50");
      expect(result.data[0].actorName).toBe("Ash");
    }
  });

  it("maps achievement_earned events correctly", async () => {
    mockPrisma.follow.findMany.mockResolvedValue([]);
    mockPrisma.collectionCard.findMany.mockResolvedValue([]);
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([
      {
        id: "ua-1",
        earnedAt: NOW,
        user: mockUser("user-1", "Ash"),
        achievement: { name: "First Card", description: "Add your first card", icon: "trophy" },
      },
    ]);

    const result = await getActivityFeed("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].type).toBe("achievement_earned");
      expect(result.data[0].description).toContain("First Card");
      expect(result.data[0].metadata.icon).toBe("trophy");
    }
  });

  it("maps new_follower events correctly", async () => {
    mockPrisma.follow.findMany
      .mockResolvedValueOnce([]) // followed users query
      .mockResolvedValueOnce([ // recent follows query
        {
          id: "follow-1",
          createdAt: NOW,
          follower: mockUser("user-1", "Ash"),
          following: mockUser("user-2", "Misty"),
        },
      ]);
    mockPrisma.collectionCard.findMany.mockResolvedValue([]);
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const result = await getActivityFeed("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].type).toBe("new_follower");
      expect(result.data[0].description).toContain("Misty");
    }
  });

  it("sorts events by date descending across types", async () => {
    mockPrisma.follow.findMany.mockResolvedValue([]);
    mockPrisma.collectionCard.findMany.mockResolvedValue([
      {
        id: "cc-1",
        addedAt: TWO_HOURS_AGO,
        card: { id: "c1", name: "Old Card", gameType: "POKEMON" },
        collection: { name: "Col", user: mockUser("user-1") },
      },
    ]);
    mockPrisma.listing.findMany.mockResolvedValue([
      {
        id: "l-1",
        createdAt: NOW,
        price: 10,
        card: { id: "c2", name: "New Listing" },
        user: mockUser("user-1"),
      },
    ]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([
      {
        id: "ua-1",
        earnedAt: HOUR_AGO,
        user: mockUser("user-1"),
        achievement: { name: "Badge", description: "desc", icon: "star" },
      },
    ]);

    const result = await getActivityFeed("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].type).toBe("new_listing"); // NOW
      expect(result.data[1].type).toBe("achievement_earned"); // HOUR_AGO
      expect(result.data[2].type).toBe("card_added"); // TWO_HOURS_AGO
    }
  });

  it("respects limit parameter", async () => {
    mockPrisma.follow.findMany.mockResolvedValue([]);
    const manyCards = Array.from({ length: 10 }, (_, i) => ({
      id: `cc-${i}`,
      addedAt: new Date(NOW.getTime() - i * 60000),
      card: { id: `c${i}`, name: `Card ${i}`, gameType: "POKEMON" },
      collection: { name: "Col", user: mockUser("user-1") },
    }));
    mockPrisma.collectionCard.findMany.mockResolvedValue(manyCards);
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const result = await getActivityFeed("user-1", 3);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
    }
  });

  it("uses 'Unknown' for null user names", async () => {
    mockPrisma.follow.findMany.mockResolvedValue([]);
    mockPrisma.collectionCard.findMany.mockResolvedValue([
      {
        id: "cc-1",
        addedAt: NOW,
        card: { id: "c1", name: "Card", gameType: "POKEMON" },
        collection: { name: "Col", user: mockUser("user-1", null) },
      },
    ]);
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const result = await getActivityFeed("user-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].actorName).toBe("Unknown");
    }
  });

  it("returns error on DB failure", async () => {
    mockPrisma.follow.findMany.mockRejectedValue(new Error("DB error"));

    const result = await getActivityFeed("user-1");

    expect(result.success).toBe(false);
  });
});
