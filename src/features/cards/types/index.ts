import type { GameType } from "@/shared/types";

export type SortBy = "name" | "price_desc" | "price_asc" | "newest";

export interface CardSearchParams {
  query: string;
  gameType?: GameType;
  setName?: string;
  rarity?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SortBy;
  gameFilters?: GameSpecificFilters;
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

export interface SetInfo {
  setName: string;
  setCode: string | null;
  cardCount: number;
  gameType: GameType;
}

export interface GameSpecificFilters {
  // Pokemon
  pokemonType?: string;
  pokemonStage?: string;
  pokemonHpMin?: number;
  pokemonHpMax?: number;
  // Yu-Gi-Oh!
  yugiohCardType?: string;
  yugiohAttribute?: string;
  yugiohLevel?: number;
  yugiohRace?: string;
  // MTG
  mtgColors?: string[];
  mtgCmcMin?: number;
  mtgCmcMax?: number;
  mtgTypeLine?: string;
  // One Piece
  onepieceColor?: string;
  onepieceCardType?: string;
  onepieceCostMin?: number;
  onepieceCostMax?: number;
}
