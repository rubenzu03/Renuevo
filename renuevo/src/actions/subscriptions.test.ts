import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  subscription: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  priceHistory: { create: vi.fn() },
  $transaction: vi.fn(),
}));

const { requireAuthMock, redirectMock, revalidatePathMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireAuth: requireAuthMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import {
  createSubscription,
  deleteSubscription,
  toggleSubscriptionActive,
  updateSubscription,
  type ActionState,
} from "./subscriptions";

function subscriptionForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("name", "Netflix");
  fd.set("price", "9.99");
  fd.set("currency", "EUR");
  fd.set("billingCycle", "monthly");
  fd.set("nextRenewalDate", "2026-09-01");
  for (const [key, value] of Object.entries(overrides)) fd.set(key, value);
  return fd;
}

function decimal(equals: (v: string) => boolean) {
  return { equals };
}

const initial: ActionState = { status: "ok" };

describe("createSubscription", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    prismaMock.subscription.create.mockReset();
  });

  it("requires auth", async () => {
    await createSubscription(initial, subscriptionForm());
    expect(requireAuthMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an empty name", async () => {
    const res = await createSubscription(initial, subscriptionForm({ name: "" }));
    expect(res.status).toBe("error");
    expect((res as { fieldErrors: Record<string, string[]> }).fieldErrors).toHaveProperty("name");
    expect(prismaMock.subscription.create).not.toHaveBeenCalled();
  });

  it("rejects prices with more than two decimals", async () => {
    const res = await createSubscription(initial, subscriptionForm({ price: "12.345" }));
    expect(res.status).toBe("error");
    expect((res as { fieldErrors: Record<string, string[]> }).fieldErrors).toHaveProperty("price");
  });

  it("rejects non-numeric prices", async () => {
    const res = await createSubscription(initial, subscriptionForm({ price: "abc" }));
    expect(res.status).toBe("error");
    expect((res as { fieldErrors: Record<string, string[]> }).fieldErrors).toHaveProperty("price");
  });

  it("rejects lowercase currencies", async () => {
    const res = await createSubscription(initial, subscriptionForm({ currency: "eur" }));
    expect(res.status).toBe("error");
    expect((res as { fieldErrors: Record<string, string[]> }).fieldErrors).toHaveProperty("currency");
  });

  it("rejects malformed dates", async () => {
    const res = await createSubscription(initial, subscriptionForm({ nextRenewalDate: "09/01/2026" }));
    expect(res.status).toBe("error");
    expect((res as { fieldErrors: Record<string, string[]> }).fieldErrors).toHaveProperty("nextRenewalDate");
  });

  it("rejects an invalid billing cycle", async () => {
    const res = await createSubscription(initial, subscriptionForm({ billingCycle: "forever" }));
    expect(res.status).toBe("error");
    expect((res as { fieldErrors: Record<string, string[]> }).fieldErrors).toHaveProperty("billingCycle");
  });

  it("creates a subscription for valid input and redirects", async () => {
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    prismaMock.subscription.create.mockResolvedValue({ id: "sub1" });

    await expect(createSubscription(initial, subscriptionForm())).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(prismaMock.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Netflix",
          priceCurrent: "9.99",
          currency: "EUR",
          isActive: true,
        }),
      })
    );
    expect(redirectMock).toHaveBeenCalledWith("/subscriptions");
  });
});

describe("updateSubscription", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    prismaMock.subscription.findUnique.mockReset();
    prismaMock.subscription.update.mockReset();
    prismaMock.priceHistory.create.mockReset();
    prismaMock.$transaction.mockReset();
    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock) => Promise<void>) => {
        await fn(prismaMock);
      }
    );
  });

  it("reports a missing subscription", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    const res = await updateSubscription("nope", initial, subscriptionForm());
    expect(res).toEqual({ status: "error", message: "Subscription not found" });
  });

  it("does not record a price change when the price is unchanged", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      priceCurrent: decimal((v) => v === "9.99"),
    });
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      updateSubscription("sub1", initial, subscriptionForm())
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prismaMock.priceHistory.create).not.toHaveBeenCalled();
  });

  it("records the old price when the price changes", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({
      priceCurrent: decimal((v) => v === "9.99"),
    });
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      updateSubscription("sub1", initial, subscriptionForm({ price: "12.00" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prismaMock.priceHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subscriptionId: "sub1" }),
      })
    );
    expect(prismaMock.subscription.update).toHaveBeenCalled();
  });
});

describe("toggleSubscriptionActive", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    prismaMock.subscription.findUnique.mockReset();
    prismaMock.subscription.update.mockReset();
  });

  it("redirects when the subscription is missing", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    await expect(
      toggleSubscriptionActive("nope", new FormData())
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  it("flips isActive", async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({ isActive: true });
    prismaMock.subscription.update.mockResolvedValue({});
    await toggleSubscriptionActive("sub1", new FormData());
    expect(prismaMock.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
  });
});

describe("deleteSubscription", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    prismaMock.subscription.delete.mockReset();
  });

  it("deletes and redirects", async () => {
    prismaMock.subscription.delete.mockResolvedValue({});
    await deleteSubscription("sub1", new FormData());
    expect(prismaMock.subscription.delete).toHaveBeenCalledWith({ where: { id: "sub1" } });
    expect(redirectMock).toHaveBeenCalledWith("/subscriptions");
  });
});