import { describe, expect, it } from "vitest";
import {
  forecastOutflow,
  priceHikes,
  spendingByCycle,
  topSpenders,
  wasteCandidates,
  type InsightSubscription,
} from "./insights";

const NOW = new Date("2026-09-07T12:00:00Z");

function sub(overrides: Partial<InsightSubscription> = {}): InsightSubscription {
  return {
    name: "Netflix",
    priceCurrent: 15.49,
    currency: "EUR",
    billingCycle: "monthly",
    nextRenewalDate: new Date("2026-09-10T00:00:00Z"),
    category: "Streaming",
    ...overrides,
  };
}

describe("topSpenders", () => {
  it("ranks by normalized monthly cost", () => {
    const ranked = topSpenders([
      sub({ name: "Cheap", priceCurrent: 2.99 }),
      sub({ name: "Yearly", priceCurrent: 120, billingCycle: "yearly" }),
      sub({ name: "Big", priceCurrent: 29, billingCycle: "monthly" }),
    ]);
    expect(ranked.map((r) => r.name)).toEqual(["Big", "Yearly", "Cheap"]);
    expect(ranked[1].monthly).toBeCloseTo(10, 5);
  });

  it("respects the limit", () => {
    const subs = Array.from({ length: 7 }, (_, i) =>
      sub({ name: `Sub ${i}`, priceCurrent: i + 1 })
    );
    expect(topSpenders(subs)).toHaveLength(5);
    expect(topSpenders(subs, 2)).toHaveLength(2);
  });
});

describe("spendingByCycle", () => {
  it("groups counts and monthly totals per cycle", () => {
    const splits = spendingByCycle([
      sub({ billingCycle: "monthly", priceCurrent: 10 }),
      sub({ billingCycle: "monthly", priceCurrent: 20 }),
      sub({ billingCycle: "yearly", priceCurrent: 120 }),
    ]);
    expect(splits).toHaveLength(2);
    expect(splits[0]).toMatchObject({ cycle: "monthly", count: 2, monthly: 30 });
    expect(splits[1].monthly).toBeCloseTo(10, 5);
  });
});

describe("forecastOutflow", () => {
  it("sums renewals inside the window", () => {
    const forecast = forecastOutflow(
      [
        sub({ priceCurrent: 10, nextRenewalDate: new Date("2026-09-10T00:00:00Z") }),
        sub({
          priceCurrent: 20,
          billingCycle: "yearly",
          nextRenewalDate: new Date("2026-12-01T00:00:00Z"),
        }),
      ],
      30,
      NOW
    );
    expect(forecast).toMatchObject({ total: 10, currency: "EUR", renewals: 1 });
  });

  it("counts weekly renewals multiple times", () => {
    const forecast = forecastOutflow(
      [
        sub({
          priceCurrent: 5,
          billingCycle: "weekly",
          nextRenewalDate: new Date("2026-09-07T00:00:00Z"),
        }),
      ],
      30,
      NOW
    );
    expect(forecast.renewals).toBeGreaterThan(1);
    expect(forecast.total).toBe(forecast.renewals * 5);
  });

  it("defaults the currency when empty", () => {
    expect(forecastOutflow([], 30, NOW)).toMatchObject({
      total: 0,
      currency: "EUR",
      renewals: 0,
    });
  });
});

describe("priceHikes", () => {
  it("detects increases from the oldest recorded price", () => {
    const hikes = priceHikes([
      sub({
        name: "Netflix",
        priceCurrent: 15.49,
        priceHistories: [
          { price: 12.99, recordedAt: new Date("2025-01-01T00:00:00Z") },
          { price: 15.49, recordedAt: new Date("2026-01-01T00:00:00Z") },
        ],
      }),
      sub({
        name: "Flat",
        priceCurrent: 9.99,
        priceHistories: [{ price: 9.99, recordedAt: new Date("2025-01-01T00:00:00Z") }],
      }),
      sub({ name: "NoHistory", priceCurrent: 5 }),
    ]);
    expect(hikes).toHaveLength(1);
    expect(hikes[0]).toMatchObject({
      name: "Netflix",
      oldPrice: 12.99,
      newPrice: 15.49,
    });
    expect(hikes[0].increasePct).toBeCloseTo(19.2, 1);
  });
});

describe("wasteCandidates", () => {
  it("flags duplicate names and weekly billing", () => {
    const candidates = wasteCandidates([
      sub({ name: "Netflix" }),
      sub({ name: "netflix  " }),
      sub({ name: "Gym", priceCurrent: 7, billingCycle: "weekly" }),
      sub({ name: "Solo", priceCurrent: 3 }),
    ]);
    const reasons = candidates.map((c) => c.reason);
    expect(reasons).toContain("Possible duplicate (2 entries)");
    expect(reasons).toContain("Billed weekly - a longer cycle may be cheaper");
    expect(candidates.find((c) => c.name === "Solo")).toBeUndefined();
  });
});
