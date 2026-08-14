import { describe, expect, it } from "vitest";
import { PRESETS } from "./presets";

describe("PRESETS", () => {
  it("has at least one preset", () => {
    expect(PRESETS.length).toBeGreaterThan(0);
  });

  it("exposes a monthly billing cycle for every preset", () => {
    for (const preset of PRESETS) {
      expect(preset.billingCycle).toBe("monthly");
    }
  });

  it("uses logo paths and hex colors", () => {
    for (const preset of PRESETS) {
      expect(preset.logo).toMatch(/^\/logos\/.+\.png$/);
      expect(preset.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("has unique ids", () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});