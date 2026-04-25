import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";
import type { OfferItem, TransactionItem } from "../types";

const OFFER_EXPIRY_HOURS = 48;

export async function makeOffer(
  listingId: string,
  buyerId: string,
  price: number,
  message?: string,
): Promise<Result<{ id: string }>> {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "ACTIVE") {
      return { success: false, error: new Error("Listing not available") };
    }
    if (listing.userId === buyerId) {
      return { success: false, error: new Error("Cannot make offer on your own listing") };
    }

    const offer = await prisma.offer.create({
      data: {
        listingId,
        buyerId,
        price,
        message: message || null,
        expiresAt: new Date(Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000),
      },
      select: { id: true },
    });
    return { success: true, data: offer };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to make offer") };
  }
}

export async function acceptOffer(
  offerId: string,
  sellerId: string,
): Promise<Result<{ transactionId: string }>> {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer || offer.status !== "PENDING") {
      return { success: false, error: new Error("Offer not found") };
    }
    if (offer.listing.userId !== sellerId) {
      return { success: false, error: new Error("Not authorized") };
    }
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      await prisma.offer.update({ where: { id: offerId }, data: { status: "EXPIRED" } });
      return { success: false, error: new Error("This offer has expired") };
    }

    // Create transaction, mark offer accepted, mark listing sold, decline other offers
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          listingId: offer.listingId,
          sellerId,
          buyerId: offer.buyerId,
          price: offer.price,
        },
        select: { id: true },
      }),
      prisma.offer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" },
      }),
      prisma.listing.update({
        where: { id: offer.listingId },
        data: { status: "SOLD" },
      }),
      prisma.offer.updateMany({
        where: {
          listingId: offer.listingId,
          id: { not: offerId },
          status: "PENDING",
        },
        data: { status: "DECLINED" },
      }),
    ]);

    return { success: true, data: { transactionId: transaction.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to accept offer") };
  }
}

export async function declineOffer(
  offerId: string,
  sellerId: string,
): Promise<Result<void>> {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: { select: { userId: true } } },
    });
    if (!offer || offer.status !== "PENDING") {
      return { success: false, error: new Error("Offer not found") };
    }
    if (offer.listing.userId !== sellerId) {
      return { success: false, error: new Error("Not authorized") };
    }
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      await prisma.offer.update({ where: { id: offerId }, data: { status: "EXPIRED" } });
      return { success: false, error: new Error("This offer has expired") };
    }
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "DECLINED" },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to decline offer") };
  }
}

export async function withdrawOffer(
  offerId: string,
  buyerId: string,
): Promise<Result<void>> {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer || offer.status !== "PENDING" || offer.buyerId !== buyerId) {
      return { success: false, error: new Error("Offer not found") };
    }
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      await prisma.offer.update({ where: { id: offerId }, data: { status: "EXPIRED" } });
      return { success: false, error: new Error("This offer has expired") };
    }
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "WITHDRAWN" },
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to withdraw offer") };
  }
}

export async function counterOffer(
  offerId: string,
  sellerId: string,
  counterPrice: number,
  message?: string,
): Promise<Result<{ id: string }>> {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer || offer.status !== "PENDING") {
      return { success: false, error: new Error("Offer not found or not pending") };
    }
    if (offer.listing.userId !== sellerId) {
      return { success: false, error: new Error("Not authorized") };
    }
    if (offer.expiresAt && offer.expiresAt < new Date()) {
      await prisma.offer.update({ where: { id: offerId }, data: { status: "EXPIRED" } });
      return { success: false, error: new Error("This offer has expired") };
    }

    // Mark original as COUNTERED, create new offer with counter price
    const [, counterOfferRecord] = await prisma.$transaction([
      prisma.offer.update({
        where: { id: offerId },
        data: { status: "COUNTERED" },
      }),
      prisma.offer.create({
        data: {
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          price: counterPrice,
          message: message || `Counter-offer: ${counterPrice}`,
          expiresAt: new Date(Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000),
        },
        select: { id: true },
      }),
    ]);

    return { success: true, data: counterOfferRecord };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to counter offer") };
  }
}

export async function getOffersOnListing(
  listingId: string,
  sellerId: string,
): Promise<Result<OfferItem[]>> {
  try {
    const listing = await prisma.listing.findFirst({ where: { id: listingId, userId: sellerId } });
    if (!listing) return { success: false, error: new Error("Listing not found") };

    const offers = await prisma.offer.findMany({
      where: { listingId },
      include: {
        buyer: { select: { id: true, name: true, image: true } },
        listing: {
          select: {
            id: true,
            price: true,
            card: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: offers.map((o) => ({
        id: o.id,
        price: Number(o.price),
        message: o.message,
        status: o.status,
        expiresAt: o.expiresAt,
        createdAt: o.createdAt,
        buyer: o.buyer,
        listing: {
          id: o.listing.id,
          price: Number(o.listing.price),
          card: o.listing.card,
        },
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch offers") };
  }
}

export async function getUserOffersSent(
  buyerId: string,
): Promise<Result<OfferItem[]>> {
  try {
    const offers = await prisma.offer.findMany({
      where: { buyerId },
      include: {
        buyer: { select: { id: true, name: true, image: true } },
        listing: {
          select: {
            id: true,
            price: true,
            card: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: offers.map((o) => ({
        id: o.id,
        price: Number(o.price),
        message: o.message,
        status: o.status,
        expiresAt: o.expiresAt,
        createdAt: o.createdAt,
        buyer: o.buyer,
        listing: {
          id: o.listing.id,
          price: Number(o.listing.price),
          card: o.listing.card,
        },
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch sent offers") };
  }
}

export async function getUserOffersReceived(
  sellerId: string,
): Promise<Result<OfferItem[]>> {
  try {
    const offers = await prisma.offer.findMany({
      where: { listing: { userId: sellerId } },
      include: {
        buyer: { select: { id: true, name: true, image: true } },
        listing: {
          select: {
            id: true,
            price: true,
            card: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: offers.map((o) => ({
        id: o.id,
        price: Number(o.price),
        message: o.message,
        status: o.status,
        expiresAt: o.expiresAt,
        createdAt: o.createdAt,
        buyer: o.buyer,
        listing: {
          id: o.listing.id,
          price: Number(o.listing.price),
          card: o.listing.card,
        },
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch received offers") };
  }
}

export async function getUserTransactions(
  userId: string,
): Promise<Result<TransactionItem[]>> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
      include: {
        listing: {
          select: { card: { select: { id: true, name: true, imageUrl: true, gameType: true } } },
        },
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
        ratings: { select: { raterId: true, score: true } },
      },
      orderBy: { completedAt: "desc" },
    });

    return {
      success: true,
      data: transactions.map((t) => ({
        id: t.id,
        price: Number(t.price),
        completedAt: t.completedAt,
        listing: t.listing,
        seller: t.seller,
        buyer: t.buyer,
        ratings: t.ratings,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch transactions") };
  }
}
