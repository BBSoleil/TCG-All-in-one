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

// Marketplace types

export interface ListingItem {
  id: string;
  price: number;
  condition: string;
  description: string | null;
  quantity: number;
  isTradeOnly: boolean;
  status: string;
  createdAt: Date;
  seller: {
    id: string;
    name: string | null;
    image: string | null;
    avgRating: number | null;
  };
  card: {
    id: string;
    name: string;
    gameType: string;
    setName: string | null;
    rarity: string | null;
    imageUrl: string | null;
    marketPrice: unknown;
  };
}

export interface OfferItem {
  id: string;
  price: number;
  message: string | null;
  status: string;
  createdAt: Date;
  buyer: {
    id: string;
    name: string | null;
    image: string | null;
  };
  listing: {
    id: string;
    card: {
      id: string;
      name: string;
      imageUrl: string | null;
    };
    price: number;
  };
}

export interface TransactionItem {
  id: string;
  price: number;
  completedAt: Date;
  listing: {
    card: {
      id: string;
      name: string;
      imageUrl: string | null;
    };
  };
  seller: { id: string; name: string | null };
  buyer: { id: string; name: string | null };
  ratings: { raterId: string; score: number }[];
}

export interface UserRatingInfo {
  avgRating: number | null;
  totalRatings: number;
}

export interface WishlistMatch {
  listing: ListingItem;
  wishlistCardId: string;
  targetPrice: number | null;
}

export {
  createListingSchema,
  updateListingPriceSchema,
  makeOfferSchema,
  rateTransactionSchema,
} from "./schemas";
export type {
  CreateListingInput,
  UpdateListingPriceInput,
  MakeOfferInput,
  RateTransactionInput,
} from "./schemas";
