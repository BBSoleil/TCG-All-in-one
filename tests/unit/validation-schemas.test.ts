import { describe, it, expect } from "vitest";
import {
  createListingSchema,
  updateListingPriceSchema,
  makeOfferSchema,
  rateTransactionSchema,
} from "@/features/market/types/schemas";
import {
  createDeckSchema,
  addCardToDeckSchema,
} from "@/features/decks/types/schemas";
import { followSchema } from "@/features/social/types/schemas";

describe("createListingSchema", () => {
  it("accepts valid input", () => {
    const result = createListingSchema.safeParse({
      cardId: "card-123",
      price: "9.99",
      condition: "Near Mint",
      quantity: "2",
      isTradeOnly: "false",
      description: "Great card",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(9.99);
      expect(result.data.quantity).toBe(2);
      expect(result.data.isTradeOnly).toBe(false);
    }
  });

  it("rejects empty cardId", () => {
    const result = createListingSchema.safeParse({
      cardId: "",
      price: "10",
      condition: "Mint",
      quantity: "1",
      isTradeOnly: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = createListingSchema.safeParse({
      cardId: "card-1",
      price: "-5",
      condition: "Mint",
      quantity: "1",
      isTradeOnly: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid condition", () => {
    const result = createListingSchema.safeParse({
      cardId: "card-1",
      price: "10",
      condition: "Destroyed",
      quantity: "1",
      isTradeOnly: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity of 0", () => {
    const result = createListingSchema.safeParse({
      cardId: "card-1",
      price: "10",
      condition: "Mint",
      quantity: "0",
      isTradeOnly: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 500 chars", () => {
    const result = createListingSchema.safeParse({
      cardId: "card-1",
      price: "10",
      condition: "Mint",
      quantity: "1",
      isTradeOnly: false,
      description: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("coerces isTradeOnly from string 'true'", () => {
    const result = createListingSchema.safeParse({
      cardId: "card-1",
      price: "0",
      condition: "Mint",
      quantity: "1",
      isTradeOnly: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isTradeOnly).toBe(true);
    }
  });
});

describe("updateListingPriceSchema", () => {
  it("accepts valid input", () => {
    const result = updateListingPriceSchema.safeParse({
      listingId: "listing-1",
      newPrice: 15.5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero price", () => {
    const result = updateListingPriceSchema.safeParse({
      listingId: "listing-1",
      newPrice: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = updateListingPriceSchema.safeParse({
      listingId: "listing-1",
      newPrice: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe("makeOfferSchema", () => {
  it("accepts valid input", () => {
    const result = makeOfferSchema.safeParse({
      listingId: "listing-1",
      price: 25,
      message: "Interested!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero price", () => {
    const result = makeOfferSchema.safeParse({
      listingId: "listing-1",
      price: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects message over 500 chars", () => {
    const result = makeOfferSchema.safeParse({
      listingId: "listing-1",
      price: 10,
      message: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("allows omitted message", () => {
    const result = makeOfferSchema.safeParse({
      listingId: "listing-1",
      price: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe("rateTransactionSchema", () => {
  it("accepts score of 1", () => {
    const result = rateTransactionSchema.safeParse({
      transactionId: "tx-1",
      score: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts score of 5", () => {
    const result = rateTransactionSchema.safeParse({
      transactionId: "tx-1",
      score: 5,
      comment: "Great trade!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects score of 0", () => {
    const result = rateTransactionSchema.safeParse({
      transactionId: "tx-1",
      score: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects score of 6", () => {
    const result = rateTransactionSchema.safeParse({
      transactionId: "tx-1",
      score: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects comment over 1000 chars", () => {
    const result = rateTransactionSchema.safeParse({
      transactionId: "tx-1",
      score: 3,
      comment: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("createDeckSchema", () => {
  it("accepts valid input", () => {
    const result = createDeckSchema.safeParse({
      name: "My Deck",
      gameType: "POKEMON",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Deck");
    }
  });

  it("trims whitespace from name", () => {
    const result = createDeckSchema.safeParse({
      name: "  Trimmed Deck  ",
      gameType: "MTG",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Trimmed Deck");
    }
  });

  it("rejects empty name", () => {
    const result = createDeckSchema.safeParse({
      name: "",
      gameType: "POKEMON",
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const result = createDeckSchema.safeParse({
      name: "   ",
      gameType: "POKEMON",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 chars", () => {
    const result = createDeckSchema.safeParse({
      name: "x".repeat(101),
      gameType: "MTG",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid gameType", () => {
    const result = createDeckSchema.safeParse({
      name: "Test",
      gameType: "DIGIMON",
    });
    expect(result.success).toBe(false);
  });
});

describe("addCardToDeckSchema", () => {
  it("accepts valid input", () => {
    const result = addCardToDeckSchema.safeParse({
      deckId: "deck-1",
      cardId: "card-1",
      quantity: 3,
      isSideboard: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects quantity over 99", () => {
    const result = addCardToDeckSchema.safeParse({
      deckId: "deck-1",
      cardId: "card-1",
      quantity: 100,
      isSideboard: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity of 0", () => {
    const result = addCardToDeckSchema.safeParse({
      deckId: "deck-1",
      cardId: "card-1",
      quantity: 0,
      isSideboard: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("followSchema", () => {
  it("accepts valid userId", () => {
    const result = followSchema.safeParse({ followingId: "user-123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = followSchema.safeParse({ followingId: "" });
    expect(result.success).toBe(false);
  });
});
