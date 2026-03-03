export type GameType = "POKEMON" | "YUGIOH" | "MTG" | "ONEPIECE";

export const GAME_LABELS: Record<GameType, string> = {
  POKEMON: "Pokemon TCG",
  YUGIOH: "Yu-Gi-Oh!",
  MTG: "Magic: The Gathering",
  ONEPIECE: "One Piece Card Game",
};

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
