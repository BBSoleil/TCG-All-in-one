export interface GameBreakdown {
  gameType: string;
  cardCount: number;
  totalValue: number;
}

export interface RarityBreakdown {
  rarity: string;
  count: number;
}

export interface TopCard {
  id: string;
  name: string;
  gameType: string;
  setName: string | null;
  imageUrl: string | null;
  marketPrice: number;
  quantity: number;
  totalValue: number;
}

export interface AnalyticsData {
  gameBreakdown: GameBreakdown[];
  rarityBreakdown: RarityBreakdown[];
  topCards: TopCard[];
  totalUniqueCards: number;
  totalCardCopies: number;
  totalValue: number;
  avgCardValue: number;
  collectionsCount: number;
}
