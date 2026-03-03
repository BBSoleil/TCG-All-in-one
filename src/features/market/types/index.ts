export interface PricePoint {
  date: Date;
  price: number;
  source: string;
}

export interface MarketData {
  cardId: string;
  currentPrice: number | null;
  priceHistory: PricePoint[];
  lastUpdated: Date | null;
}
