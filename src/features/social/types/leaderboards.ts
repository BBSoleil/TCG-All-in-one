export type LeaderboardCategory =
  | "portfolio"
  | "cards"
  | "followers"
  | "achievements"
  | "trades";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  value: number;
}

export const LEADERBOARD_LABELS: Record<LeaderboardCategory, string> = {
  portfolio: "Portfolio Value",
  cards: "Card Collection",
  followers: "Most Followed",
  achievements: "Achievements",
  trades: "Top Traders",
};
