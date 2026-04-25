export interface QuickOfferPrice {
  offerPrice: number;
  atTarget: boolean;
}

/**
 * For a wishlist match, decide the 1-click offer price.
 * - If the listing is already at or below the buyer's target, offer the asking price (no reason to underbid).
 * - If the listing is above target, offer the target (best deal for buyer — seller can accept/decline/counter).
 * - If no target set, default to asking price.
 */
export function computeQuickOfferPrice(
  listingPrice: number,
  targetPrice: number | null,
): QuickOfferPrice {
  if (targetPrice === null || targetPrice >= listingPrice) {
    return { offerPrice: listingPrice, atTarget: false };
  }
  return { offerPrice: targetPrice, atTarget: true };
}
