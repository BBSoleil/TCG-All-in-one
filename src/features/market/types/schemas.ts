import { z } from "zod";

const CARD_CONDITIONS = [
  "Mint",
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
] as const;

const CURRENCIES = ["EUR", "USD"] as const;
const SHIPPING_ZONES = ["DOMESTIC", "EU", "WORLDWIDE"] as const;
const LANGUAGES = [
  "EN", "FR", "JP", "DE", "ES", "IT", "PT", "KO", "ZH_HANS", "ZH_HANT",
] as const;

const shippingZoneSchema = z.object({
  zone: z.enum(SHIPPING_ZONES),
  price: z.coerce.number().min(0, "Shipping price must be 0 or greater"),
  currency: z.enum(CURRENCIES).default("EUR"),
  estimatedMin: z.coerce.number().int().min(1, "Minimum days must be at least 1"),
  estimatedMax: z.coerce.number().int().min(1, "Maximum days must be at least 1"),
});

export const createListingSchema = z.object({
  cardId: z.string().min(1, "Card is required"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  condition: z.enum(CARD_CONDITIONS, {
    error: "Invalid condition",
  }),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  isTradeOnly: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  currency: z.enum(CURRENCIES).default("EUR"),
  language: z.enum(LANGUAGES).default("EN"),
  shippingZones: z.array(shippingZoneSchema).max(3, "Maximum 3 shipping zones").optional(),
});

export const CURRENCY_OPTIONS = CURRENCIES;
export const SHIPPING_ZONE_OPTIONS = SHIPPING_ZONES;
export const LISTING_LANGUAGE_OPTIONS = LANGUAGES;

export const updateListingPriceSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  newPrice: z.coerce.number().positive("Price must be greater than 0"),
});

export const makeOfferSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  message: z.string().max(500, "Message must be 500 characters or less").optional(),
});

export const rateTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  score: z.coerce.number().int().min(1, "Score must be at least 1").max(5, "Score must be at most 5"),
  comment: z.string().max(1000, "Comment must be 1000 characters or less").optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type ShippingZoneInput = z.infer<typeof shippingZoneSchema>;
export type UpdateListingPriceInput = z.infer<typeof updateListingPriceSchema>;
export type MakeOfferInput = z.infer<typeof makeOfferSchema>;
export type RateTransactionInput = z.infer<typeof rateTransactionSchema>;
