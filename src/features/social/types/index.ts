export interface PublicProfile {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  isPublic: boolean;
  collectionCount: number;
  totalCards: number;
  followerCount: number;
  followingCount: number;
  achievements: PublicAchievement[];
  joinedAt: Date;
}

export interface PublicCollection {
  id: string;
  name: string;
  gameType: string;
  cardCount: number;
  updatedAt: Date;
}

export interface PublicAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: Date;
}

export interface FollowState {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

export interface UserSearchResult {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  followerCount: number;
  isFollowing: boolean;
}

export type {
  LeaderboardCategory,
  LeaderboardEntry,
} from "./leaderboards";
export { LEADERBOARD_LABELS } from "./leaderboards";

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: "collection" | "social" | "milestone";
  threshold: number;
}

export { followSchema } from "./schemas";
export type { FollowInput } from "./schemas";
