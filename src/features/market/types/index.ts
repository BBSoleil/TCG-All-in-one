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

export interface ShippingZoneItem {
  zone: string;
  price: number;
  currency: string;
  estimatedMin: number;
  estimatedMax: number;
}

export interface ListingItem {
  id: string;
  price: number;
  currency: string;
  language: string;
  photos: string[];
  condition: string;
  description: string | null;
  quantity: number;
  isTradeOnly: boolean;
  status: string;
  shippingZones: ShippingZoneItem[];
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
  expiresAt: Date | null;
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
      gameType: string;
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
  CURRENCY_OPTIONS,
  SHIPPING_ZONE_OPTIONS,
  LISTING_LANGUAGE_OPTIONS,
} from "./schemas";
export type {
  CreateListingInput,
  UpdateListingPriceInput,
  MakeOfferInput,
  RateTransactionInput,
  ShippingZoneInput,
} from "./schemas";
