import { describe, expect, it } from "vitest";
import {
  categoryBreakdown,
  monthlySpendTrend,
  renewalDatesInRange,
  renewalsForMonth,
  type AnalyzableSubscription,
} from "@/lib/analytics-service";

function sub(
  overrides: Partial<AnalyzableSubscription & { createdAt: Date }> = {}
): AnalyzableSubscription & { createdAt?: Date } {
  return {
    name: "Test",
    priceCurrent: 10,
    currency: "EUR",
    billingCycle: "monthly",
    nextRenewalDate: new Date("2026-03-15T12:00:00Z"),
    category: null,
    ...overrides,
  };
}

describe("renewalDatesInRange", () => {
  it("returns dates within the range when nextRenewalDate is inside", () => {
    const s = sub({ billingCycle: "monthly" });
    const dates = renewalDatesInRange(
      s,
      new Date("2026-03-01"),
      new Date("2026-04-30")
    );
    expect(dates).toHaveLength(2);
    expect(dates[0].getUTCDate()).toBe(15);
    expect(dates[1].getUTCMonth()).toBe(3);
  });

  it("finds past-aligned renewals when nextRenewalDate is after the range", () => {
    const s = sub({
      billingCycle: "monthly",
      nextRenewalDate: new Date("2026-06-15T12:00:00Z"),
    });
    const dates = renewalDatesInRange(
      s,
      new Date("2026-04-01"),
      new Date("2026-04-30")
    );
    expect(dates).toHaveLength(1);
    expect(dates[0].getUTCMonth()).toBe(3);
    expect(dates[0].getUTCDate()).toBe(15);
  });

  it("handles weekly cycles with multiple hits", () => {
    const s = sub({
      billingCycle: "weekly",
      nextRenewalDate: new Date("2026-03-02T12:00:00Z"), // a Monday
    });
    const dates = renewalDatesInRange(
      s,
      new Date("2026-03-02"),
      new Date("2026-03-29")
    );
    expect(dates).toHaveLength(4);
  });

  it("returns empty when nothing aligns in range", () => {
    const s = sub({
      billingCycle: "yearly",
      nextRenewalDate: new Date("2027-03-15T12:00:00Z"),
    });
    const dates = renewalDatesInRange(
      s,
      new Date("2026-03-01"),
      new Date("2026-03-31")
    );
    expect(dates).toHaveLength(1); // aligned back to 2026-03-15
  });
});

describe("categoryBreakdown", () => {
  it("groups by category and sorts descending by monthly total", () => {
    const slices = categoryBreakdown([
      sub({ name: "A", priceCurrent: 10, category: "streaming" }),
      sub({ name: "B", priceCurrent: 20, category: "streaming" }),
      sub({ name: "C", priceCurrent: 100, billingCycle: "yearly", category: "software" }),
      sub({ name: "D", priceCurrent: 5, category: null }),
    ]);
    expect(slices.map((s) => s.category)).toEqual([
      "streaming",
      "software",
      "Other",
    ]);
    expect(slices[0]).toMatchObject({ total: 30, count: 2 });
    expect(slices[1].total).toBeCloseTo(100 / 12, 5);
    expect(slices[2].total).toBeCloseTo(5, 5);
  });

  it("normalizes weekly prices to monthly", () => {
    const slices = categoryBreakdown([
      sub({ priceCurrent: 52, billingCycle: "weekly", category: "gym" }),
    ]);
    expect(slices[0].total).toBeCloseTo((52 * 52) / 12, 5);
  });
});

describe("monthlySpendTrend", () => {
  it("produces the requested number of points ending on the current month", () => {
    const now = new Date(2026, 7, 24);
    const points = monthlySpendTrend([], 6, now);
    expect(points).toHaveLength(6);
    expect(points[5].month).toBe(7);
    expect(points[5].year).toBe(2026);
    expect(points[0].label).toBe("Mar");
  });

  it("includes subscriptions only from their creation month onward", () => {
    const now = new Date(2026, 2, 15);
    const points = monthlySpendTrend(
      [sub({ createdAt: new Date(2026, 1, 10) })],
      3,
      now
    );
    expect(points[0].total).toBe(0); // Jan
    expect(points[1].total).toBe(10); // Feb
    expect(points[2].total).toBe(10); // Mar
  });
});

describe("renewalsForMonth", () => {
  it("collects and sorts renewals across subscriptions", () => {
    const renewals = renewalsForMonth(
      [
        sub({ name: "Late", nextRenewalDate: new Date("2026-03-20T12:00:00Z") }),
        sub({ name: "Early", nextRenewalDate: new Date("2026-03-05T12:00:00Z") }),
      ],
      2026,
      2
    );
    expect(renewals.map((r) => r.name)).toEqual(["Early", "Late"]);
    expect(renewals[0].price).toBe(10);
  });

  it("excludes renewals outside the month", () => {
    const renewals = renewalsForMonth(
      [
        sub({
          billingCycle: "yearly",
          nextRenewalDate: new Date("2027-04-15T12:00:00Z"),
        }),
      ],
      2026,
      2
    );
    expect(renewals).toHaveLength(0);
  });
});
