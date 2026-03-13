"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { rateLimit, RATE_LIMITS } from "@/shared/lib/rate-limit";
import { createListing, cancelListing, updateListingPrice } from "../services/listings";
import { createListingSchema, updateListingPriceSchema } from "../types/schemas";

export async function createListingAction(
  formData: FormData,
): Promise<{ error?: string; id?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const shippingZonesRaw = formData.get("shippingZones");
  const photosRaw = formData.get("photos");

  const parsed = createListingSchema.safeParse({
    cardId: formData.get("cardId"),
    price: formData.get("price"),
    condition: formData.get("condition"),
    quantity: formData.get("quantity") ?? "1",
    isTradeOnly: formData.get("isTradeOnly"),
    description: formData.get("description") || undefined,
    currency: formData.get("currency") || "EUR",
    language: formData.get("language") || "EN",
    shippingZones: shippingZonesRaw ? JSON.parse(shippingZonesRaw as string) : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { cardId, price, condition, quantity, isTradeOnly, description, currency, language, shippingZones } = parsed.data;
  const photos: string[] = photosRaw ? JSON.parse(photosRaw as string) : [];

  const rl = rateLimit(`${session.user.id}:createListing`, RATE_LIMITS.createListing);
  if (!rl.success) return { error: "Too many requests. Please try again later." };

  if (!isTradeOnly && price <= 0) return { error: "Price must be greater than 0" };

  const result = await createListing(
    session.user.id,
    cardId,
    price,
    condition,
    quantity,
    isTradeOnly,
    description,
    currency,
    language,
    photos,
    shippingZones,
  );
  if (!result.success) return { error: result.error.message };

  revalidatePath("/market");
  return { id: result.data.id };
}

export async function cancelListingAction(
  listingId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = await cancelListing(listingId, session.user.id);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/market");
  return {};
}

export async function updateListingPriceAction(
  listingId: string,
  newPrice: number,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = updateListingPriceSchema.safeParse({ listingId, newPrice });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateListingPrice(parsed.data.listingId, session.user.id, parsed.data.newPrice);
  if (!result.success) return { error: result.error.message };

  revalidatePath("/market");
  revalidatePath("/market/my-listings");
  return {};
}

export async function searchCardsForListing(
  search: string,
): Promise<{ id: string; name: string; gameType: string; setName: string | null }[]> {
  const { prisma } = await import("@/shared/lib/prisma");
  const cards = await prisma.card.findMany({
    where: { name: { contains: search, mode: "insensitive" } },
    select: { id: true, name: true, gameType: true, setName: true },
    orderBy: { name: "asc" },
    take: 20,
  });
  return cards;
}
