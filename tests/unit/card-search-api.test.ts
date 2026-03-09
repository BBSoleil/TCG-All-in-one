import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";

// Mock next/cache (unstable_cache used by cached())
vi.mock("next/cache", () => ({
  unstable_cache: (fn: Function) => fn,
  revalidatePath: vi.fn(),
}));

// Mock rate limiter to always allow
vi.mock("@/shared/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, remaining: 59, resetAt: Date.now() + 60000 }),
  RATE_LIMITS: {
    createListing: { maxRequests: 10, windowMs: 60000 },
    makeOffer: { maxRequests: 10, windowMs: 60000 },
    followUser: { maxRequests: 20, windowMs: 60000 },
    importCards: { maxRequests: 5, windowMs: 60000 },
    cardSearch: { maxRequests: 60, windowMs: 60000 },
  },
}));

import { GET as searchHandler } from "@/app/api/cards/search/route";
import { GET as setsHandler } from "@/app/api/cards/sets/route";
import { NextRequest } from "next/server";

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/cards/search", () => {
  beforeEach(() => {
    mockPrisma.card.findMany.mockReset();
    mockPrisma.card.count.mockReset();
  });

  it("returns search results with cache headers", async () => {
    const mockCards = [
      {
        id: "pokemon-1",
        name: "Pikachu",
        gameType: "POKEMON",
        setName: "Base Set",
        rarity: "COMMON",
        imageUrl: "https://example.com/pikachu.png",
        marketPrice: 5.99,
      },
    ];
    mockPrisma.card.findMany.mockResolvedValue(mockCards);
    mockPrisma.card.count.mockResolvedValue(1);

    const res = await searchHandler(makeRequest("/api/cards/search?query=Pikachu&gameType=POKEMON"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=60, stale-while-revalidate=300");

    const json = await res.json();
    expect(json.cards).toHaveLength(1);
    expect(json.cards[0].name).toBe("Pikachu");
    expect(json.total).toBe(1);
  });

  it("returns empty results for no matches", async () => {
    mockPrisma.card.findMany.mockResolvedValue([]);
    mockPrisma.card.count.mockResolvedValue(0);

    const res = await searchHandler(makeRequest("/api/cards/search?query=nonexistent"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cards).toHaveLength(0);
    expect(json.total).toBe(0);
  });

  it("handles pagination params", async () => {
    mockPrisma.card.findMany.mockResolvedValue([]);
    mockPrisma.card.count.mockResolvedValue(100);

    const res = await searchHandler(makeRequest("/api/cards/search?page=3&pageSize=10"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.page).toBe(3);
    expect(json.pageSize).toBe(10);
    expect(json.totalPages).toBe(10);

    expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it("passes game-specific filters through", async () => {
    mockPrisma.card.findMany.mockResolvedValue([]);
    mockPrisma.card.count.mockResolvedValue(0);

    await searchHandler(makeRequest("/api/cards/search?gameType=POKEMON&pokemonType=Fire"));

    expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          gameType: "POKEMON",
          pokemonDetails: expect.objectContaining({
            types: { has: "Fire" },
          }),
        }),
      }),
    );
  });

  it("returns 500 on database error", async () => {
    mockPrisma.card.findMany.mockRejectedValue(new Error("DB error"));

    const res = await searchHandler(makeRequest("/api/cards/search?query=test"));

    expect(res.status).toBe(500);
  });
});

describe("GET /api/cards/sets", () => {
  beforeEach(() => {
    mockPrisma.card.groupBy.mockReset();
  });

  it("returns sets with cache headers", async () => {
    mockPrisma.card.groupBy.mockResolvedValue([
      { setName: "Base Set", setCode: "base1", gameType: "POKEMON", _count: { id: 102 } },
    ]);

    const res = await setsHandler(makeRequest("/api/cards/sets?gameType=POKEMON"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=3600, stale-while-revalidate=86400");

    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].setName).toBe("Base Set");
    expect(json[0].cardCount).toBe(102);
  });

  it("returns all game sets when no gameType specified", async () => {
    mockPrisma.card.groupBy.mockResolvedValue([
      { setName: "Base Set", setCode: "base1", gameType: "POKEMON", _count: { id: 102 } },
      { setName: "Metal Raiders", setCode: "MRD", gameType: "YUGIOH", _count: { id: 56 } },
    ]);

    const res = await setsHandler(makeRequest("/api/cards/sets"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(2);
  });
});
