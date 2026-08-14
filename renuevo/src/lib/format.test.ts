import { describe, expect, it } from "vitest";
import { daysUntilText, formatMoney } from "./format";

describe("formatMoney", () => {
  it("formats a known currency", () => {
    expect(formatMoney(9.99, "EUR")).toBe("€9.99");
  });

  it("falls back to plain output for an unknown currency", () => {
    const out = formatMoney(12.5, "XYZ");
    expect(out).toContain("12.50");
    expect(out).toContain("XYZ");
  });

  it("handles zero", () => {
    expect(formatMoney(0, "USD")).toBe("$0.00");
  });
});

describe("daysUntilText", () => {
  it("returns today for zero", () => {
    expect(daysUntilText(0)).toBe("today");
  });

  it("singular day", () => {
    expect(daysUntilText(1)).toBe("in 1 day");
  });

  it("plural days", () => {
    expect(daysUntilText(5)).toBe("in 5 days");
  });

  it("past due for negatives", () => {
    expect(daysUntilText(-2)).toBe("past due");
  });
});