import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  subscription: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  priceHistory: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  createSubscription,
  deleteSubscription,
  getSubscription,
  getSubscriptionWithPriceHistory,
  listSubscriptions,
  toggleSubscriptionActive,
  updateSubscription,
} from "./subscriptions-service";
import type { SubscriptionInput } from "./subscription-validation";

function decimal(value: string) {
  return { toString: () => value, equals: (v: string) => value === v };
}

const input: SubscriptionInput = {
  name: "Netflix",
  price: "9.99",
  currency: "EUR",
  billingCycle: "monthly",
  billingIntervalDays: null,
  nextRenewalDate: "2026-09-01",
  category: "streaming",
};

describe("subscriptions-service", () => {
  beforeEach(() => {
    prismaMock.subscription.create.mockReset();
    prismaMock.subscription.findMany.mockReset();
    prismaMock.subscription.findUnique.mockReset();
    prismaMock.subscription.update.mockReset();
    prismaMock.subscription.delete.mockReset();
    prismaMock.priceHistory.create.mockReset();
    prismaMock.$transaction.mockReset();
  });

  describe("createSubscription", () => {
    it("creates a subscription with the mapped input and active by default", async () => {
      prismaMock.subscription.create.mockResolvedValue({ id: "sub_1" });

      await createSubscription(input);

      expect(prismaMock.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Netflix",
          priceCurrent: "9.99",
          currency: "EUR",
          isActive: true,
        }),
      });
    });
  });

  describe("listSubscriptions", () => {
    it("lists subscriptions newest first", async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);

      await listSubscriptions();

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getSubscription", () => {
    it("fetches a subscription by id", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await getSubscription("sub_1");

      expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: "sub_1" },
      });
    });
  });

  describe("getSubscriptionWithPriceHistory", () => {
    it("includes price history ordered by recordedAt", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await getSubscriptionWithPriceHistory("sub_1");

      expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: "sub_1" },
        include: { priceHistories: { orderBy: { recordedAt: "asc" } } },
      });
    });
  });

  describe("updateSubscription", () => {
    beforeEach(() => {
      prismaMock.$transaction.mockImplementation(
        async (fn: (tx: typeof prismaMock) => Promise<unknown>) =>
          fn(prismaMock)
      );
    });

    it("returns null when the subscription does not exist", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      expect(await updateSubscription("sub_1", input)).toBeNull();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("archives the current price when the price changes", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        priceCurrent: decimal("9.99"),
      });
      prismaMock.subscription.update.mockResolvedValue({ id: "sub_1" });

      await updateSubscription("sub_1", { ...input, price: "12.99" });

      expect(prismaMock.priceHistory.create).toHaveBeenCalledWith({
        data: { subscriptionId: "sub_1", price: expect.anything() },
      });
      expect(prismaMock.subscription.update).toHaveBeenCalled();
    });

    it("does not archive when the price is unchanged", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        priceCurrent: decimal("9.99"),
      });
      prismaMock.subscription.update.mockResolvedValue({ id: "sub_1" });

      await updateSubscription("sub_1", input);

      expect(prismaMock.priceHistory.create).not.toHaveBeenCalled();
    });
  });

  describe("deleteSubscription", () => {
    it("returns false when the subscription does not exist", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      expect(await deleteSubscription("sub_1")).toBe(false);
      expect(prismaMock.subscription.delete).not.toHaveBeenCalled();
    });

    it("deletes and returns true", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({ id: "sub_1" });
      prismaMock.subscription.delete.mockResolvedValue({});

      expect(await deleteSubscription("sub_1")).toBe(true);
      expect(prismaMock.subscription.delete).toHaveBeenCalledWith({
        where: { id: "sub_1" },
      });
    });
  });

  describe("toggleSubscriptionActive", () => {
    it("returns null when the subscription does not exist", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      expect(await toggleSubscriptionActive("sub_1")).toBeNull();
      expect(prismaMock.subscription.update).not.toHaveBeenCalled();
    });

    it("flips isActive", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({ isActive: true });
      prismaMock.subscription.update.mockResolvedValue({ isActive: false });

      const result = await toggleSubscriptionActive("sub_1");

      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: "sub_1" },
        data: { isActive: false },
      });
      expect(result).toEqual({ isActive: false });
    });
  });
});