import { z } from "zod";

const GAME_TYPES = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"] as const;

export const createDeckSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  gameType: z.enum(GAME_TYPES, {
    error: "Invalid game type",
  }),
  format: z.string().optional(),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
});

export const addCardToDeckSchema = z.object({
  deckId: z.string().min(1, "Deck ID is required"),
  cardId: z.string().min(1, "Card ID is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(99, "Quantity must be at most 99"),
  isSideboard: z.boolean(),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type AddCardToDeckInput = z.infer<typeof addCardToDeckSchema>;
