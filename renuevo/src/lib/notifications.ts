import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { formatMoney } from "@/lib/format";

export const NOTIFICATION_TYPES = {
  UPCOMING_RENEWAL: "upcoming_renewal",
  PRICE_CHANGE: "price_change",
} as const;

const RENEWAL_WINDOW_DAYS = 3;

export type RunResult = {
  advanced: number;
  renewalsNotified: number;
  priceChangesNotified: number;
};

function isUniqueViolation(e: unknown): boolean {
  return (e as { code?: string }).code === "P2002";
}

function advanceDate(date: Date, cycle: string): Date {
  switch (cycle) {
    case "weekly":
      return addWeeks(date, 1);
    case "quarterly":
      return addMonths(date, 3);
    case "yearly":
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

async function advancePastDue(now: Date): Promise<number> {
  const today = startOfDay(now);
  const pastDue = await prisma.subscription.findMany({
    where: { isActive: true, nextRenewalDate: { lt: today } },
  });

  let count = 0;
  for (const sub of pastDue) {
    let next = sub.nextRenewalDate;
    while (isBefore(next, today)) {
      next = advanceDate(next, sub.billingCycle);
    }
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { nextRenewalDate: next },
    });
    count++;
  }
  return count;
}

async function notifyUpcomingRenewals(now: Date): Promise<number> {
  const today = startOfDay(now);
  const deadline = addDays(today, RENEWAL_WINDOW_DAYS);
  const upcoming = await prisma.subscription.findMany({
    where: { isActive: true, nextRenewalDate: { gte: today, lte: deadline } },
  });

  let count = 0;
  for (const sub of upcoming) {
    try {
      await prisma.notificationLog.create({
        data: {
          subscriptionId: sub.id,
          type: NOTIFICATION_TYPES.UPCOMING_RENEWAL,
          billingCycleStart: sub.nextRenewalDate,
        },
      });
    } catch (e) {
      if (isUniqueViolation(e)) continue;
      throw e;
    }

    await sendMail({
      subject: `Renuevo: ${sub.name} renews soon`,
      text: `${sub.name} renews on ${format(
        sub.nextRenewalDate,
        "MMMM d, yyyy"
      )} (${differenceInCalendarDays(
        sub.nextRenewalDate,
        today
      )} days from now).\nAmount: ${formatMoney(
        Number(sub.priceCurrent),
        sub.currency
      )}`,
    });
    count++;
  }
  return count;
}

async function notifyPriceChanges(): Promise<number> {
  const rows = await prisma.priceHistory.findMany({
    where: { notificationLog: { is: null } },
    include: { subscription: true },
    orderBy: [{ subscriptionId: "asc" }, { recordedAt: "asc" }],
  });

  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const hasPrevious =
      i > 0 && rows[i - 1].subscriptionId === row.subscriptionId;

    const prevPrice = hasPrevious ? rows[i - 1].price : null;
    const nextPrice =
      i + 1 < rows.length && rows[i + 1].subscriptionId === row.subscriptionId
        ? rows[i + 1].price
        : row.subscription.priceCurrent;

    if (prevPrice !== null && row.price.equals(prevPrice)) continue;

    try {
      await prisma.notificationLog.create({
        data: {
          subscriptionId: row.subscriptionId,
          type: NOTIFICATION_TYPES.PRICE_CHANGE,
          priceHistoryId: row.id,
        },
      });
    } catch (e) {
      if (isUniqueViolation(e)) continue;
      throw e;
    }

    await sendMail({
      subject: `Renuevo: ${row.subscription.name} price change`,
      text: `${row.subscription.name} price changed from ${formatMoney(
        Number(row.price),
        row.subscription.currency
      )} to ${formatMoney(Number(nextPrice), row.subscription.currency)}.`,
    });
    count++;
  }
  return count;
}

export async function runChecks(now = new Date()): Promise<RunResult> {
  const advanced = await advancePastDue(now);
  const renewalsNotified = await notifyUpcomingRenewals(now);
  const priceChangesNotified = await notifyPriceChanges();
  return { advanced, renewalsNotified, priceChangesNotified };
}