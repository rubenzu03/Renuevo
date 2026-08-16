import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  detectRecurring,
  normalizeMerchant,
  MIN_OCCURRENCES,
  type DetectionResult,
} from "./detect";
import { MockBankProvider } from "./mock";
import type { RawBankTransaction } from "./types";

function charge(
  merchantName: string,
  amount: number,
  date: Date | string,
  currency = "EUR"
): RawBankTransaction {
  return {
    externalId: `${merchantName}-${date}`,
    merchantName,
    amount,
    currency,
    date: typeof date === "string" ? new Date(date) : date,
  };
}

function monthlySeries(
  merchantName: string,
  amount: number,
  count: number,
  start: Date,
  currency?: string
): RawBankTransaction[] {
  return Array.from({ length: count }, (_, i) =>
    charge(merchantName, -amount, addMonths(start, i), currency)
  );
}

function byMerchant(results: DetectionResult[]): Map<string, DetectionResult> {
  return new Map(results.map((r) => [r.merchantName, r]));
}

describe("normalizeMerchant", () => {
  it("lowercases and trims the merchant name", () => {
    expect(normalizeMerchant("Netflix")).toBe("netflix");
    expect(normalizeMerchant("  SPOTIFY  ")).toBe("spotify");
  });

  it("strips asterisk suffixes like Plaid's merchant names", () => {
    expect(normalizeMerchant("NETFLIX.COM *")).toBe("netflix");
  });

  it("collapses inner whitespace", () => {
    expect(normalizeMerchant("World    Gym")).toBe("world gym");
  });
});

describe("detectRecurring", () => {
  it("returns an empty array for no transactions", () => {
    expect(detectRecurring([])).toEqual([]);
  });

  it("detects a merchant with at least 3 equal monthly charges", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = monthlySeries("Netflix", 9.99, 6, start);

    const results = detectRecurring(transactions);
    expect(results).toHaveLength(1);

    const result = results[0];
    expect(result.merchantName).toBe("netflix");
    expect(result.amount).toBe(9.99);
    expect(result.billingCycle).toBe("monthly");
    expect(result.occurrences).toBe(6);
    expect(result.priceChanged).toBe(false);
  });

  it("ignores merchants with fewer than 3 charges", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = monthlySeries("Netflix", 9.99, 2, start);

    expect(detectRecurring(transactions)).toEqual([]);
  });

  it("ignores one-off purchases with scattered amounts", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = [
      charge("Starbucks", -4.5, addMonths(start, 0)),
      charge("Starbucks", -6.2, addMonths(start, 1)),
      charge("Starbucks", -5.1, addMonths(start, 2)),
      charge("Starbucks", -7.8, addMonths(start, 3)),
      charge("Starbucks", -4.9, addMonths(start, 4)),
    ];

    expect(detectRecurring(transactions)).toEqual([]);
  });

  it("requires the same amount to appear at least 3 times", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = [
      charge("Netflix", -9.99, addMonths(start, 0)),
      charge("Netflix", -9.99, addMonths(start, 1)),
      charge("Netflix", -12.0, addMonths(start, 2)),
      charge("Netflix", -12.0, addMonths(start, 3)),
      charge("Netflix", -12.0, addMonths(start, 4)),
    ];

    const results = detectRecurring(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].amount).toBe(12.0);
  });

  it("flags a price change when a merchant has clusters from two amounts", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = [
      ...monthlySeries("Netflix", 9.99, 4, start),
      ...monthlySeries("Netflix", 12.99, 4, addMonths(start, 4)),
    ];

    const results = detectRecurring(transactions);
    expect(results).toHaveLength(1);
    const result = results[0];
    expect(result.amount).toBe(12.99);
    expect(result.occurrences).toBe(4);
    expect(result.priceChanged).toBe(true);
  });

  it("ignores positive amounts (income)", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = monthlySeries("Salary", 2500, 6, start).map((t) => ({
      ...t,
      amount: Math.abs(t.amount),
    }));

    expect(detectRecurring(transactions)).toEqual([]);
  });

  it("maps weekly cadence", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = Array.from({ length: 6 }, (_, i) =>
      charge("Gym Class", -19.99, addWeeks(start, i + 1))
    );

    const results = detectRecurring(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].billingCycle).toBe("weekly");
  });

  it("maps quarterly cadence", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = Array.from({ length: 4 }, (_, i) =>
      charge("HQ Office", -89.0, addMonths(start, i * 3))
    );

    const results = detectRecurring(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].billingCycle).toBe("quarterly");
  });

  it("maps yearly cadence", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = Array.from({ length: 3 }, (_, i) =>
      charge("Annual Plan", -240.0, addYears(start, i))
    );

    const results = detectRecurring(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].billingCycle).toBe("yearly");
  });

  it("ignores charges with an irregular cadence", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = [
      charge("Odd Co", -9.99, start),
      charge("Odd Co", -9.99, addDays(start, 16)),
      charge("Odd Co", -9.99, addDays(start, 34)),
    ];

    expect(detectRecurring(transactions)).toEqual([]);
  });

  it("computes nextDueDate from the last charge plus the cadence", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = monthlySeries("Netflix", 9.99, 4, start);

    const results = detectRecurring(transactions);
    const lastSeen = addMonths(start, 3);
    expect(results[0].nextDueDate).toEqual(addDays(lastSeen, 30));
  });

  it("deduplicates and groups by normalized merchant name", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const transactions = [
      ...monthlySeries("NETFLIX.COM *", 9.99, 3, start),
      ...monthlySeries("Netflix", 9.99, 3, addMonths(start, 3)),
    ];

    const results = detectRecurring(transactions);
    expect(results).toHaveLength(1);
    expect(results[0].merchantName).toBe("netflix");
    expect(results[0].occurrences).toBe(6);
  });

  it("detects the seeded mock merchants", async () => {
    const provider = new MockBankProvider("conn-1");
    const transactions = await provider.fetchTransactions();

    const results = detectRecurring(transactions);
    const map = byMerchant(results);

    expect(map.get("netflix")).toBeDefined();
    expect(map.get("netflix")?.billingCycle).toBe("monthly");
    expect(map.get("netflix")?.priceChanged).toBe(true);

    expect(map.get("spotify")?.priceChanged).toBe(false);
    expect(map.get("world gym")?.billingCycle).toBe("monthly");
    expect(map.get("icloud")?.billingCycle).toBe("monthly");

    for (const oneOff of ["starbucks", "amazon", "uber", "shell"]) {
      expect(map.get(oneOff)).toBeUndefined();
    }
  });
});

describe("MIN_OCCURRENCES", () => {
  it("is exported as a number", () => {
    expect(MIN_OCCURRENCES).toBe(3);
  });
});