import type { GameType } from "@/shared/types";

export interface Deck {
  id: string;
  name: string;
  gameType: GameType;
  userId: string;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}
