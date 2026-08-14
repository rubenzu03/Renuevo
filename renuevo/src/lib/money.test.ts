import { describe, expect, it } from "vitest";
import { monthlyAmount } from "./money";

describe("monthlyAmount", () => {
  it("keeps monthly as-is", () => {
    expect(monthlyAmount(10, "monthly")).toBe(10);
  });

  it("weekly is price * 52 / 12", () => {
    expect(monthlyAmount(3, "weekly")).toBeCloseTo(13);
  });

  it("quarterly is price / 3", () => {
    expect(monthlyAmount(30, "quarterly")).toBe(10);
  });

  it("yearly is price / 12", () => {
    expect(monthlyAmount(120, "yearly")).toBe(10);
  });

  it("defaults unknown cycles to monthly", () => {
    expect(monthlyAmount(7, "bogus")).toBe(7);
  });
});