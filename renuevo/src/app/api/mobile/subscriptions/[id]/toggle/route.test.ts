import { beforeEach, describe, expect, it, vi } from "vitest";

const { isMobileAuthorizedMock } = vi.hoisted(() => ({
  isMobileAuthorizedMock: vi.fn(),
}));

vi.mock("@/lib/mobile-auth", () => ({
  isMobileAuthorized: isMobileAuthorizedMock,
}));

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/mobile/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mobile/http")>();
  return { ...actual };
});

import { NextRequest } from "next/server";
import { PATCH } from "./route";

function decimal(value: string) {
  return { toString: () => value, equals: (v: string) => value === v };
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    name: "Netflix",
    priceCurrent: decimal("9.99"),
    currency: "EUR",
    billingCycle: "monthly",
    billingIntervalDays: null,
    nextRenewalDate: new Date("2026-09-01T00:00:00Z"),
    category: "streaming",
    isActive: true,
    createdAt: new Date("2026-08-01T00:00:00Z"),
    updatedAt: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  };
}

const ctx = { params: Promise.resolve({ id: "sub_1" }) };

function request(): NextRequest {
  const req = new NextRequest("http://localhost:3000/api/mobile/subscriptions/sub_1/toggle", {
    method: "PATCH",
  });
  req.headers.set("authorization", "Bearer token");
  return req;
}

describe("PATCH /api/mobile/subscriptions/:id/toggle", () => {
  beforeEach(() => {
    isMobileAuthorizedMock.mockReset();
    isMobileAuthorizedMock.mockReturnValue(true);
    prismaMock.subscription.findUnique.mockReset();
    prismaMock.subscription.update.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    isMobileAuthorizedMock.mockReturnValue(false);
    const res = await PATCH(request(), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 for missing subscriptions", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    const res = await PATCH(request(), ctx);
    expect(res.status).toBe(404);
  });

  it("toggles isActive and returns the updated subscription", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(subscription());
    prismaMock.subscription.update.mockResolvedValue(
      subscription({ isActive: false })
    );
    const res = await PATCH(request(), ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isActive).toBe(false);
    expect(prismaMock.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { isActive: false },
    });
  });
});