"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { rateLimit, RATE_LIMITS } from "@/shared/lib/rate-limit";
import { makeOffer, acceptOffer, declineOffer, withdrawOffer } from "../services/offers";
import { rateTransaction } from "../services/ratings";
import { makeOfferSchema, rateTransactionSchema } from "../types/schemas";

export async function makeOfferAction(
  listingId: string,
  price: number,
  message?: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = makeOfferSchema.safeParse({ listingId, price, message });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const rl = rateLimit(`${session.user.id}:makeOffer`, RATE_LIMITS.makeOffer);
  if (!rl.success) return { error: "Too many requests. Please try again later." };

  const result = await makeOffer(parsed.data.listingId, session.user.id, parsed.data.price, parsed.data.message);
  if (!result.success) return { error: result.error.message };

  revalidatePath(`/market/listing/${parsed.data.listingId}`);
  revalidatePath("/market/offers");
  return {};
}

export async function acceptOfferAction(
  offerId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await acceptOffer(offerId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/market");
  revalidatePath("/market/offers");
  revalidatePath("/market/history");
  revalidatePath("/leaderboards");
  return {};
}

export async function declineOfferAction(
  offerId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await declineOffer(offerId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/market/offers");
  return {};
}

export async function withdrawOfferAction(
  offerId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await withdrawOffer(offerId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/market/offers");
  return {};
}

export async function rateTransactionAction(
  transactionId: string,
  score: number,
  comment?: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = rateTransactionSchema.safeParse({ transactionId, score, comment });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await rateTransaction(parsed.data.transactionId, session.user.id, parsed.data.score, parsed.data.comment);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/market/history");
  return {};
}
