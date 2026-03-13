import { describe, it, expect } from "vitest";
import { formatPrice } from "@/shared/lib/format";

describe("formatPrice", () => {
  it("formats EUR prices with € symbol", () => {
    expect(formatPrice(10.5, "EUR")).toBe("€10.50");
  });

  it("formats USD prices with $ symbol", () => {
    expect(formatPrice(10.5, "USD")).toBe("$10.50");
  });

  it("defaults to EUR when no currency specified", () => {
    expect(formatPrice(25)).toBe("€25.00");
  });

  it("handles zero price", () => {
    expect(formatPrice(0, "EUR")).toBe("€0.00");
    expect(formatPrice(0, "USD")).toBe("$0.00");
  });

  it("handles large prices", () => {
    expect(formatPrice(99999.99, "EUR")).toBe("€99999.99");
  });

  it("handles unknown currency with fallback", () => {
    expect(formatPrice(10, "GBP")).toBe("10.00 GBP");
  });
});
