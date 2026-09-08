import { describe, expect, it } from "vitest";
import { parseReceiptEmail, parseReceiptEmails } from "./parse";
import type { EmailMessage } from "./types";

function msg(overrides: Partial<EmailMessage> = {}): EmailMessage {
  return {
    id: "1",
    from: "receipts@netflix.com",
    subject: "Your Netflix receipt",
    body: "We billed €15.49 to your card on 2026-08-03.",
    date: new Date("2026-08-03T00:00:00Z"),
    ...overrides,
  };
}

describe("parseReceiptEmail", () => {
  it("parses merchant, amount, currency and date", () => {
    const parsed = parseReceiptEmail(msg());
    expect(parsed).toMatchObject({
      merchantName: "Netflix",
      amount: 15.49,
      currency: "EUR",
    });
    expect(parsed?.date).toEqual(new Date("2026-08-03T00:00:00Z"));
  });

  it("parses USD amounts and code-style currencies", () => {
    const parsed = parseReceiptEmail(
      msg({
        from: "no-reply@spotify.com",
        subject: "Your Spotify invoice",
        body: "Total: USD 9.99 charged on 2026-07-08.",
      })
    );
    expect(parsed).toMatchObject({
      merchantName: "Spotify",
      amount: 9.99,
      currency: "USD",
    });
  });

  it("falls back to the sender domain for the merchant name", () => {
    const parsed = parseReceiptEmail(
      msg({
        from: "billing@worldgym.com",
        subject: "Payment confirmation",
        body: "You paid €29.00 on 2026-08-15. Thanks!",
      })
    );
    expect(parsed?.merchantName).toBe("Worldgym");
    expect(parsed?.amount).toBe(29);
  });

  it("falls back to the message date when no date is found", () => {
    const date = new Date("2026-08-03T00:00:00Z");
    const parsed = parseReceiptEmail(
      msg({ body: "We billed €15.49 to your card.", date })
    );
    expect(parsed?.date).toEqual(date);
  });

  it("returns null when no amount is present", () => {
    expect(
      parseReceiptEmail(msg({ subject: "Hello", body: "Just saying hi." }))
    ).toBeNull();
  });
});

describe("parseReceiptEmails", () => {
  it("skips unparseable messages", () => {
    const receipts = parseReceiptEmails([
      msg(),
      msg({ id: "2", subject: "Hello", body: "no amount here" }),
    ]);
    expect(receipts).toHaveLength(1);
    expect(receipts[0].merchantName).toBe("Netflix");
  });
});
