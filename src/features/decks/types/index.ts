import type { GameType } from "@/shared/types";

export interface Deck {
  id: string;
  name: string;
  description: string | null;
  gameType: GameType;
  format: string | null;
  isPublic: boolean;
  userId: string;
  cardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeckWithCards extends Deck {
  cards: DeckCardWithDetails[];
}

export interface DeckCardWithDetails {
  id: string;
  quantity: number;
  isSideboard: boolean;
  card: {
    id: string;
    name: string;
    gameType: string;
    setName: string | null;
    rarity: string | null;
    imageUrl: string | null;
    marketPrice: unknown;
    onepieceDetails?: { cardType: string | null } | null;
  };
}

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GameFormat {
  id: string;
  name: string;
  gameType: GameType;
  minDeckSize: number;
  maxDeckSize: number;
  maxCopies: number;
  sideboardSize: number;
}

export interface DeckAnalysis {
  totalCards: number;
  sideboardCards: number;
  costCurve: { cost: number; count: number }[];
  typeBreakdown: { type: string; count: number }[];
  attributeBreakdown: { attribute: string; count: number }[];
  rarityBreakdown: { rarity: string; count: number }[];
  estimatedValue: number;
}

export { createDeckSchema, addCardToDeckSchema } from "./schemas";
export type { CreateDeckInput, AddCardToDeckInput } from "./schemas";
