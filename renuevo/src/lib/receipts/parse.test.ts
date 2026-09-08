import { describe, expect, it } from "vitest";
import { parseReceiptText } from "./parse";

describe("parseReceiptText", () => {
  it("parses a typical shop receipt", () => {
    const parsed = parseReceiptText(
      "WORLD GYM\n123 Fitness Ave\nDate: 2026-08-15\nMonthly membership\nTotal: €29.00\nThank you!"
    );
    expect(parsed).toMatchObject({
      merchantName: "WORLD GYM",
      amount: 29,
      currency: "EUR",
    });
    expect(parsed?.purchasedAt).toEqual(new Date("2026-08-15T00:00:00Z"));
  });

  it("prefers the labeled total over other amounts", () => {
    const parsed = parseReceiptText(
      "Netflix Store\nSubtotal $5.00\nGrand Total $15.49\n"
    );
    expect(parsed?.amount).toBe(15.49);
    expect(parsed?.currency).toBe("USD");
  });

  it("parses currency codes without symbols", () => {
    const parsed = parseReceiptText(
      "Spotify AB\nReceipt 2026-07-08\nAmount due 9.99 GBP\n"
    );
    expect(parsed).toMatchObject({ amount: 9.99, currency: "GBP" });
  });

  it("returns null purchasedAt when no date is present", () => {
    const parsed = parseReceiptText("iCloud\nTotal €2.99\n");
    expect(parsed?.purchasedAt).toBeNull();
  });

  it("returns null for empty or amount-less text", () => {
    expect(parseReceiptText("")).toBeNull();
    expect(parseReceiptText("   ")).toBeNull();
    expect(parseReceiptText("Hello\nJust a note\n")).toBeNull();
  });
});
