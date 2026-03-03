import type { GameType } from "@/shared/types";

export interface Collection {
  id: string;
  name: string;
  gameType: GameType;
  userId: string;
  cardCount: number;
  totalValue: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionCard {
  id: string;
  cardId: string;
  cardName: string;
  cardImageUrl: string | null;
  quantity: number;
  condition: string | null;
  notes: string | null;
  marketPrice: number | null;
  addedAt: Date;
}

export interface AddCardInput {
  collectionId: string;
  cardId: string;
  quantity: number;
  condition?: string;
  notes?: string;
}
