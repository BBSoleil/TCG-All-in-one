import { describe, it, expect } from "vitest";
import { GAME_LABELS } from "@/shared/types";

describe("shared types", () => {
  it("should have labels for all game types", () => {
    expect(GAME_LABELS.POKEMON).toBe("Pokemon TCG");
    expect(GAME_LABELS.YUGIOH).toBe("Yu-Gi-Oh!");
    expect(GAME_LABELS.MTG).toBe("Magic: The Gathering");
    expect(GAME_LABELS.ONEPIECE).toBe("One Piece Card Game");
  });
});
