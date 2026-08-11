import { addDays, startOfDay } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb } from "../../tests/db";

const { sendMailMock } = vi.hoisted(() => ({ sendMailMock: vi.fn() }));

vi.mock("@/lib/email", () => ({ sendMail: sendMailMock }));

import { prisma } from "@/lib/prisma";
import { runChecks } from "@/lib/notifications";

const NOW = new Date("2026-08-10T10:00:00.000Z");
const TODAY = startOfDay(NOW);

type SubOverrides = {
  name?: string;
  priceCurrent?: string;
  currency?: string;
  billingCycle?: string;
  nextRenewalDate?: Date;
  isActive?: boolean;
};

async function createSub(overrides: SubOverrides = {}) {
  return prisma.subscription.create({
    data: {
      name: overrides.name ?? "Test Sub",
      priceCurrent: overrides.priceCurrent ?? "9.99",
      currency: overrides.currency ?? "EUR",
      billingCycle: (overrides.billingCycle ??
        "monthly") as "weekly" | "monthly" | "quarterly" | "yearly",
      nextRenewalDate: overrides.nextRenewalDate ?? addDays(NOW, 2),
      isActive: overrides.isActive ?? true,
    },
  });
}

describe("runChecks", () => {
  beforeEach(async () => {
    await resetDb();
    sendMailMock.mockReset();
  });

  describe("advancePastDue", () => {
    it("advances a past-due monthly subscription into the future", async () => {
      const sub = await createSub({ nextRenewalDate: addDays(NOW, -32) });

      const result = await runChecks(NOW);
      expect(result.advanced).toBe(1);

      const updated = await prisma.subscription.findUniqueOrThrow({
        where: { id: sub.id },
      });
      expect(updated.nextRenewalDate.getTime()).toBeGreaterThanOrEqual(
        TODAY.getTime()
      );
    });

    it("does not advance a past-due paused subscription", async () => {
      const sub = await createSub({
        nextRenewalDate: addDays(NOW, -32),
        isActive: false,
      });

      const result = await runChecks(NOW);
      expect(result.advanced).toBe(0);

      const updated = await prisma.subscription.findUniqueOrThrow({
        where: { id: sub.id },
      });
      expect(updated.nextRenewalDate.getTime()).toBeLessThan(
        TODAY.getTime()
      );
    });
  });

  describe("notifyUpcomingRenewals", () => {
    it("notifies renewals inside the three-day window", async () => {
      const sub = await createSub({ nextRenewalDate: addDays(NOW, 2) });

      const result = await runChecks(NOW);
      expect(result.renewalsNotified).toBe(1);
      expect(sendMailMock).toHaveBeenCalledWith({
        subject: expect.stringContaining(sub.name),
        text: expect.stringContaining("renews on"),
      });

      const logs = await prisma.notificationLog.findMany();
      expect(logs).toHaveLength(1);
      expect(logs[0].subscriptionId).toBe(sub.id);
      expect(logs[0].type).toBe("upcoming_renewal");
    });

    it("ignores renewals outside the window", async () => {
      await createSub({ nextRenewalDate: addDays(NOW, 10) });
      await createSub({ nextRenewalDate: addDays(NOW, -1) });

      const result = await runChecks(NOW);
      expect(result.renewalsNotified).toBe(0);
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it("ignores paused subscriptions", async () => {
      await createSub({
        nextRenewalDate: addDays(NOW, 2),
        isActive: false,
      });

      const result = await runChecks(NOW);
      expect(result.renewalsNotified).toBe(0);
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it("does not duplicate notification for the same cycle across runs", async () => {
      await createSub({ nextRenewalDate: addDays(NOW, 2) });

      const first = await runChecks(NOW);
      const second = await runChecks(NOW);

      expect(first.renewalsNotified).toBe(1);
      expect(second.renewalsNotified).toBe(0);
      expect(sendMailMock).toHaveBeenCalledTimes(1);
      expect(await prisma.notificationLog.count()).toBe(1);
    });
  });

  describe("notifyPriceChanges", () => {
    async function seedHistory(subscriptionId: string, prices: string[]) {
      for (const price of prices) {
        await prisma.priceHistory.create({
          data: { subscriptionId, price },
        });
      }
    }

    it("sends one email per price change with from/to", async () => {
      const sub = await createSub({
        priceCurrent: "15.00",
        nextRenewalDate: addDays(NOW, 30),
      });
      await seedHistory(sub.id, ["12.00", "14.50"]);

      const result = await runChecks(NOW);
      expect(result.priceChangesNotified).toBe(2);

      const subjects = sendMailMock.mock.calls.map(
        (c) => c[0].subject
      ) as string[];
      expect(subjects.every((s) => s.includes(sub.name))).toBe(true);

      const texts = sendMailMock.mock.calls.map((c) => c[0].text) as string[];
      expect(texts.some((t) => t.includes("from €12.00 to €14.50"))).toBe(true);
      expect(texts.some((t) => t.includes("from €14.50 to €15.00"))).toBe(true);
    });

    it("links a NotificationLog per history row and stays idempotent", async () => {
      const sub = await createSub({
        priceCurrent: "15.00",
        nextRenewalDate: addDays(NOW, 30),
      });
      await seedHistory(sub.id, ["12.00"]);

      const first = await runChecks(NOW);
      const second = await runChecks(NOW);

      expect(first.priceChangesNotified).toBe(1);
      expect(second.priceChangesNotified).toBe(0);
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const logs = await prisma.notificationLog.findMany();
      expect(logs).toHaveLength(1);
      expect(logs[0].priceHistoryId).not.toBeNull();
    });

    it("skips history rows whose price equals the previous one", async () => {
      const sub = await createSub({
        priceCurrent: "12.00",
        nextRenewalDate: addDays(NOW, 30),
      });
      await seedHistory(sub.id, ["10.00", "10.00", "12.00"]);

      const result = await runChecks(NOW);
      expect(result.priceChangesNotified).toBe(2);
    });

    it("only notifies newly added changes on later runs", async () => {
      const sub = await createSub({
        priceCurrent: "20.00",
        nextRenewalDate: addDays(NOW, 30),
      });
      await seedHistory(sub.id, ["10.00"]);

      await runChecks(NOW);

      await prisma.priceHistory.create({
        data: { subscriptionId: sub.id, price: "14.00" },
      });

      const result = await runChecks(NOW);
      expect(result.priceChangesNotified).toBe(1);
      expect(sendMailMock).toHaveBeenCalledTimes(2);
    });
  });

  it("returns an aggregated result object", async () => {
    const result = await runChecks(NOW);
    expect(result).toEqual({
      advanced: 0,
      renewalsNotified: 0,
      priceChangesNotified: 0,
    });
  });
});