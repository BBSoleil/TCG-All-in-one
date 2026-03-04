import { z } from "zod";

export const addToWishlistSchema = z.object({
  cardId: z.string().min(1),
  targetPrice: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
