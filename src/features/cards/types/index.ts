import type { GameType } from "@/shared/types";

export interface CardSearchParams {
  query: string;
  gameType?: GameType;
  setName?: string;
  rarity?: string;
  page?: number;
  pageSize?: number;
}

export interface CardListItem {
  id: string;
  name: string;
  gameType: GameType;
  setName: string | null;
  rarity: string | null;
  imageUrl: string | null;
  marketPrice: number | null;
}
