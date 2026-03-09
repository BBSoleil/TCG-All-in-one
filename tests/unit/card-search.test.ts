import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { searchCards, getCardById } from "@/features/cards/services";

describe("searchCards", () => {
  beforeEach(() => {
    mockPrisma.card.findMany.mockReset();
    mockPrisma.card.count.mockReset();
  });

  it("returns paginated results", async () => {
    const mockCards = [
      {
        id: "pokemon-test-1",
        name: "Pikachu",
        gameType: "POKEMON",
        setName: "Base Set",
        rarity: "COMMON",
        imageUrl: "https://example.com/pikachu.png",
        marketPrice: { toNumber: () => 5.99 },
      },
    ];
    mockPrisma.card.findMany.mockResolvedValue(mockCards);
    mockPrisma.card.count.mockResolvedValue(1);

    const result = await searchCards({ query: "", page: 1, pageSize: 20 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cards).toHaveLength(1);
      expect(result.data.cards[0]?.name).toBe("Pikachu");
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.totalPages).toBe(1);
    }
  });

  it("filters by query name", async () => {
    mockPrisma.card.findMany.mockResolvedValue([]);
    mockPrisma.card.count.mockResolvedValue(0);

    await searchCards({ query: "Charizard" });

    expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: "Charizard", mode: "insensitive" },
        }),
      }),
    );
  });

  it("filters by game type", async () => {
    mockPrisma.card.findMany.mockResolvedValue([]);
    mockPrisma.card.count.mockResolvedValue(0);

    await searchCards({ query: "", gameType: "POKEMON" });

    expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ gameType: "POKEMON" }),
      }),
    );
  });

  it("filters by rarity", async () => {
    mockPrisma.card.findMany.mockResolvedValue([]);
    mockPrisma.card.count.mockResolvedValue(0);

    await searchCards({ query: "", rarity: "RARE" });

    expect(mockPrisma.card.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ rarity: "RARE" }),
      }),
    );
  });

  it("returns error on database failure", async () => {
    mockPrisma.card.findMany.mockRejectedValue(new Error("DB connection failed"));

    const result = await searchCards({ query: "", page: 1 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("DB connection failed");
    }
  });

  it("calculates correct total pages", async () => {
    mockPrisma.card.findMany.mockResolvedValue([]);
    mockPrisma.card.count.mockResolvedValue(45);

    const result = await searchCards({ query: "", page: 1, pageSize: 20 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalPages).toBe(3);
    }
  });
});

describe("getCardById", () => {
  beforeEach(() => {
    mockPrisma.card.findUnique.mockReset();
  });

  it("returns card with all details", async () => {
    const mockCard = {
      id: "pokemon-test-1",
      name: "Pikachu",
      gameType: "POKEMON",
      setName: "Base Set",
      setCode: "base1",
      rarity: "COMMON",
      imageUrl: "https://example.com/pikachu.png",
      marketPrice: 5.99,
      createdAt: new Date(),
      pokemonDetails: { hp: 60, types: ["Electric"], evolvesFrom: null, stage: "Basic", weakness: "Fighting x2", resistance: null, retreatCost: 1 },
      yugiohDetails: null,
      mtgDetails: null,
      onepieceDetails: null,
    };
    mockPrisma.card.findUnique.mockResolvedValue(mockCard);

    const result = await getCardById("pokemon-test-1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Pikachu");
      expect(result.data.pokemonDetails?.hp).toBe(60);
    }
  });

  it("returns error for non-existent card", async () => {
    mockPrisma.card.findUnique.mockResolvedValue(null);

    const result = await getCardById("nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe("Card not found");
    }
  });
});
