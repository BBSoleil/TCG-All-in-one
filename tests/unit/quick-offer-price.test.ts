import { describe, it, expect } from "vitest";
import { computeQuickOfferPrice } from "@/features/market/lib/quick-offer-price";

describe("computeQuickOfferPrice", () => {
  it("offers asking price when buyer has no target", () => {
    expect(computeQuickOfferPrice(50, null)).toEqual({
      offerPrice: 50,
      atTarget: false,
    });
  });

  it("offers asking price when target equals listing", () => {
    expect(computeQuickOfferPrice(50, 50)).toEqual({
      offerPrice: 50,
      atTarget: false,
    });
  });

  it("offers asking price when target is higher than listing (no underbidding)", () => {
    expect(computeQuickOfferPrice(40, 60)).toEqual({
      offerPrice: 40,
      atTarget: false,
    });
  });

  it("offers target when target is below listing", () => {
    expect(computeQuickOfferPrice(100, 75)).toEqual({
      offerPrice: 75,
      atTarget: true,
    });
  });

  it("handles decimal prices", () => {
    expect(computeQuickOfferPrice(19.99, 14.5)).toEqual({
      offerPrice: 14.5,
      atTarget: true,
    });
  });
});
