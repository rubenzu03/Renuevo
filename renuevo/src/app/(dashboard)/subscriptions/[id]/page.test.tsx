import { describe, expect, it, vi } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({ findUniqueMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findUnique: findUniqueMock } },
}));

import SubscriptionDetailPage from "./page";

describe("SubscriptionDetailPage", () => {
  it("throws notFound for an unknown subscription", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(
      SubscriptionDetailPage({ params: Promise.resolve({ id: "missing" }) })
    ).rejects.toThrow();
  });
});