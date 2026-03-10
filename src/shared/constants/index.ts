export const APP_NAME = "TCG All-in-One";
export const APP_DESCRIPTION =
  "Multi-license digital platform for TCG collectors and players";

export const SUPPORTED_GAMES = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"] as const;

export const GAME_COLORS: Record<string, string> = {
  POKEMON: "bg-yellow-500",
  YUGIOH: "bg-purple-600",
  MTG: "bg-red-600",
  ONEPIECE: "bg-blue-600",
};

export const GAME_BORDER_COLORS: Record<string, string> = {
  POKEMON: "border-yellow-500/30",
  YUGIOH: "border-purple-600/30",
  MTG: "border-red-600/30",
  ONEPIECE: "border-blue-600/30",
};

export const GAME_BADGE_CLASSES: Record<string, string> = {
  POKEMON: "bg-yellow-500 text-white",
  YUGIOH: "bg-purple-600 text-white",
  MTG: "bg-red-600 text-white",
  ONEPIECE: "bg-blue-600 text-white",
};

export const CARD_CONDITIONS = [
  "Mint",
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
] as const;
