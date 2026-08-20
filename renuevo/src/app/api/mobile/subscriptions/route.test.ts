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
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/mobile/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mobile/http")>();
  return { ...actual };
});

import { NextRequest } from "next/server";
import { GET, POST } from "./route";

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

function authedRequest(method: string, body?: unknown): NextRequest {
  const req = new NextRequest("http://localhost:3000/api/mobile/subscriptions", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  req.headers.set("authorization", "Bearer token");
  return req;
}

describe("GET /api/mobile/subscriptions", () => {
  beforeEach(() => {
    isMobileAuthorizedMock.mockReset();
    isMobileAuthorizedMock.mockReturnValue(true);
    prismaMock.subscription.findMany.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    isMobileAuthorizedMock.mockReturnValue(false);
    const res = await GET(authedRequest("GET"));
    expect(res.status).toBe(401);
    expect(prismaMock.subscription.findMany).not.toHaveBeenCalled();
  });

  it("lists subscriptions serialized as strings", async () => {
    prismaMock.subscription.findMany.mockResolvedValue([subscription()]);
    const res = await GET(authedRequest("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([
      expect.objectContaining({
        id: "sub_1",
        priceCurrent: "9.99",
        nextRenewalDate: "2026-09-01T00:00:00.000Z",
      }),
    ]);
    expect(prismaMock.subscription.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("POST /api/mobile/subscriptions", () => {
  beforeEach(() => {
    isMobileAuthorizedMock.mockReset();
    isMobileAuthorizedMock.mockReturnValue(true);
    prismaMock.subscription.create.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    isMobileAuthorizedMock.mockReturnValue(false);
    const res = await POST(authedRequest("POST", {}));
    expect(res.status).toBe(401);
  });

  it("rejects invalid payloads", async () => {
    const res = await POST(
      authedRequest("POST", { name: "", price: "abc", currency: "euro" })
    );
    expect(res.status).toBe(400);
    expect(prismaMock.subscription.create).not.toHaveBeenCalled();
  });

  it("creates a subscription and returns it", async () => {
    prismaMock.subscription.create.mockResolvedValue(subscription());
    const res = await POST(
      authedRequest("POST", {
        name: "Netflix",
        price: "9.99",
        currency: "EUR",
        billingCycle: "monthly",
        nextRenewalDate: "2026-09-01",
        category: "streaming",
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.priceCurrent).toBe("9.99");
    expect(prismaMock.subscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isActive: true, name: "Netflix" }),
    });
  });
});