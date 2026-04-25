import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "../helpers/mock-prisma";
import { getSetsForGame } from "@/features/cards/services";
import type { GameType } from "@/shared/types";

// Bypass the unstable_cache wrapper for these tests
vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

describe("getSetsForGame — SQL injection guard", () => {
  beforeEach(() => {
    mockPrisma.$queryRawUnsafe.mockReset();
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
  });

  it("rejects malicious gameType (returns empty, no SQL exec)", async () => {
    const malicious = "POKEMON' OR '1'='1" as GameType;
    const result = await getSetsForGame(malicious);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
    expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it("accepts a valid gameType and parameterizes the query", async () => {
    const result = await getSetsForGame("POKEMON" as GameType);
    expect(result.success).toBe(true);
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    const [sql, ...args] = mockPrisma.$queryRawUnsafe.mock.calls[0] as [string, ...unknown[]];
    expect(sql).toContain("$1");
    expect(sql).not.toContain("'POKEMON'");
    expect(args).toEqual(["POKEMON"]);
  });

  it("handles undefined gameType (no game filter, no params)", async () => {
    const result = await getSetsForGame();
    expect(result.success).toBe(true);
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    const [sql, ...args] = mockPrisma.$queryRawUnsafe.mock.calls[0] as [string, ...unknown[]];
    expect(sql).not.toContain("$1");
    expect(sql).not.toContain("gameType\" =");
    expect(args).toEqual([]);
  });

  for (const valid of ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"] as const) {
    it(`accepts the canonical game type ${valid}`, async () => {
      const result = await getSetsForGame(valid as GameType);
      expect(result.success).toBe(true);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
    });
  }
});

import { vi } from "vitest";
