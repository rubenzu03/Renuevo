import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb } from "../../tests/db";

const { requireAuthMock, redirectMock, revalidatePathMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireAuth: requireAuthMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { prisma } from "@/lib/prisma";
import {
  createSubscription,
  deleteSubscription,
  toggleSubscriptionActive,
  updateSubscription,
  type ActionState,
} from "@/actions/subscriptions";

const initial: ActionState = { status: "ok" };

function subscriptionForm(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("name", "Spotify");
  fd.set("price", "10.99");
  fd.set("currency", "EUR");
  fd.set("billingCycle", "monthly");
  fd.set("nextRenewalDate", "2026-09-01");
  for (const [key, value] of Object.entries(overrides)) fd.set(key, value);
  return fd;
}

describe("subscription actions (integration)", () => {
  beforeEach(async () => {
    await resetDb();
    requireAuthMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("creates a subscription in the database", async () => {
    await createSubscription(initial, subscriptionForm());

    const row = await prisma.subscription.findFirstOrThrow();
    expect(row.name).toBe("Spotify");
    expect(row.currency).toBe("EUR");
    expect(Number(row.priceCurrent)).toBe(10.99);
    expect(row.isActive).toBe(true);
  });

  it("records the old price in history when updating a price", async () => {
    const sub = await prisma.subscription.create({
      data: {
        name: "Spotify",
        priceCurrent: "10.99",
        currency: "EUR",
        billingCycle: "monthly",
        nextRenewalDate: new Date("2026-09-01T00:00:00Z"),
      },
    });

    await updateSubscription(sub.id, initial, subscriptionForm({ price: "12.99" }));

    const history = await prisma.priceHistory.findMany();
    expect(history).toHaveLength(1);
    expect(Number(history[0].price)).toBe(10.99);

    const updated = await prisma.subscription.findUniqueOrThrow({
      where: { id: sub.id },
    });
    expect(Number(updated.priceCurrent)).toBe(12.99);
  });

  it("does not record history when the price is unchanged", async () => {
    const sub = await prisma.subscription.create({
      data: {
        name: "Spotify",
        priceCurrent: "10.99",
        currency: "EUR",
        billingCycle: "monthly",
        nextRenewalDate: new Date("2026-09-01T00:00:00Z"),
      },
    });

    await updateSubscription(sub.id, initial, subscriptionForm());

    expect(await prisma.priceHistory.count()).toBe(0);
  });

  it("toggles a subscription's active state", async () => {
    const sub = await prisma.subscription.create({
      data: {
        name: "Spotify",
        priceCurrent: "10.99",
        currency: "EUR",
        billingCycle: "monthly",
        nextRenewalDate: new Date("2026-09-01T00:00:00Z"),
      },
    });

    const toggle = async () =>
      toggleSubscriptionActive(sub.id, new FormData());

    await toggle();
    expect(
      (await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } }))
        .isActive
    ).toBe(false);

    await toggle();
    expect(
      (await prisma.subscription.findUniqueOrThrow({ where: { id: sub.id } }))
        .isActive
    ).toBe(true);
  });

  it("deletes a subscription and cascades history", async () => {
    const sub = await prisma.subscription.create({
      data: {
        name: "Spotify",
        priceCurrent: "10.99",
        currency: "EUR",
        billingCycle: "monthly",
        nextRenewalDate: new Date("2026-09-01T00:00:00Z"),
      },
    });
    await prisma.priceHistory.create({
      data: { subscriptionId: sub.id, price: "9.99" },
    });
    await prisma.notificationLog.create({
      data: {
        subscriptionId: sub.id,
        type: "upcoming_renewal",
        billingCycleStart: new Date(),
      },
    });

    await deleteSubscription(sub.id, new FormData());

    expect(await prisma.subscription.count()).toBe(0);
    expect(await prisma.priceHistory.count()).toBe(0);
    expect(await prisma.notificationLog.count()).toBe(0);
  });
});