"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/shared/lib/rate-limit";
import { makeOffer, acceptOffer, declineOffer, withdrawOffer } from "../services/offers";
import { rateTransaction } from "../services/ratings";
import { addCardToCollection } from "@/features/collection/services/collection-cards";
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

  // Fetch offer details for notification before accepting
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      buyerId: true,
      listing: {
        select: { card: { select: { name: true } } },
      },
    },
  });

  const result = await acceptOffer(offerId, session.user.id);
  if (!result.success) return { error: result.error.message };

  // Notify buyer that their offer was accepted
  if (offer) {
    await prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: "OFFER_ACCEPTED",
        title: "Offer Accepted",
        message: `Your offer on ${offer.listing.card.name} was accepted!`,
        link: "/market/history",
      },
    }).catch(() => {
      // Non-critical: don't fail the action if notification fails
    });
  }

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

const addToCollectionSchema = z.object({
  collectionId: z.string().min(1, "Collection is required"),
  cardId: z.string().min(1, "Card is required"),
});

export async function addPurchasedCardToCollectionAction(
  collectionId: string,
  cardId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = addToCollectionSchema.safeParse({ collectionId, cardId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Read current quantity so we can increment
  const existing = await prisma.collectionCard.findFirst({
    where: {
      collectionId: parsed.data.collectionId,
      cardId: parsed.data.cardId,
    },
    select: { quantity: true },
  });
  const newQuantity = (existing?.quantity ?? 0) + 1;

  const result = await addCardToCollection(
    parsed.data.collectionId,
    session.user.id,
    parsed.data.cardId,
    newQuantity,
  );
  if (!result.success) return { error: result.error.message };

  revalidatePath("/market/history");
  revalidatePath(`/collection/${parsed.data.collectionId}`);
  return {};
}
