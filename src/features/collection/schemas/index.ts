import { z } from "zod";

const GAME_TYPES = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"] as const;

const CONDITIONS = [
  "Mint",
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
] as const;

const LANGUAGES = [
  "EN", "FR", "JP", "DE", "ES", "IT", "PT", "KO", "ZH_HANS", "ZH_HANT",
] as const;

export const createCollectionSchema = z.object({
  name: z.string().min(1, { error: "Collection name is required" }).max(100),
  gameType: z.enum(GAME_TYPES, { error: "Please select a game" }),
});

export const updateCollectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, { error: "Collection name is required" }).max(100),
});

export const addCardSchema = z.object({
  collectionId: z.string().min(1),
  cardId: z.string().min(1),
  quantity: z.coerce.number().int().min(1, { error: "Quantity must be at least 1" }).max(9999),
  condition: z.enum(CONDITIONS).optional(),
  language: z.enum(LANGUAGES).default("EN"),
  foil: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  notes: z.string().max(500).optional(),
});

export const updateCardSchema = z.object({
  id: z.string().min(1),
  quantity: z.coerce.number().int().min(1, { error: "Quantity must be at least 1" }).max(9999),
  condition: z.enum(CONDITIONS).optional(),
  language: z.enum(LANGUAGES).optional(),
  foil: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
  notes: z.string().max(500).optional(),
});

export const CONDITION_OPTIONS = CONDITIONS;
export const LANGUAGE_OPTIONS = LANGUAGES;

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type AddCardInput = z.infer<typeof addCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
