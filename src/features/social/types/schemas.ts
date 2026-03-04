import { z } from "zod";

export const followSchema = z.object({
  followingId: z.string().min(1, "User ID is required"),
});

export type FollowInput = z.infer<typeof followSchema>;
