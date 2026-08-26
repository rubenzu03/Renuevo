import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns";
import { monthlyAmount } from "@/lib/money";

export interface AnalyzableSubscription {
  name: string;
  priceCurrent: number;
  currency: string;
  billingCycle: string;
  nextRenewalDate: Date;
  category?: string | null;
}

export function cycleStep(cycle: string, date: Date): Date {
  switch (cycle) {
    case "weekly":
      return addWeeks(date, 1);
    case "quarterly":
      return addQuarters(date, 1);
    case "yearly":
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

function cycleBack(cycle: string, date: Date): Date {
  switch (cycle) {
    case "weekly":
      return addDays(date, -7);
    case "quarterly":
      return addQuarters(date, -1);
    case "yearly":
      return addYears(date, -1);
    default:
      return addMonths(date, -1);
  }
}

export function renewalDatesInRange(
  sub: Pick<AnalyzableSubscription, "billingCycle" | "nextRenewalDate">,
  start: Date,
  end: Date
): Date[] {
  let cursor = sub.nextRenewalDate;
  let guard = 0;
  while (cursor > start && guard < 500) {
    cursor = cycleBack(sub.billingCycle, cursor);
    guard += 1;
  }

  const dates: Date[] = [];
  let d = cursor;
  while (d <= end && guard < 2000) {
    if (d >= start) dates.push(d);
    d = cycleStep(sub.billingCycle, d);
    guard += 1;
  }
  return dates;
}

export interface CategorySlice {
  category: string;
  total: number;
  currency: string;
  count: number;
}

export function categoryBreakdown(
  subscriptions: AnalyzableSubscription[]
): CategorySlice[] {
  const groups = new Map<string, CategorySlice>();
  for (const s of subscriptions) {
    const key = s.category?.trim() || "Other";
    const existing = groups.get(key);
    if (existing) {
      existing.total += monthlyAmount(s.priceCurrent, s.billingCycle);
      existing.count += 1;
    } else {
      groups.set(key, {
        category: key,
        total: monthlyAmount(s.priceCurrent, s.billingCycle),
        currency: s.currency,
        count: 1,
      });
    }
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

export interface TrendPoint {
  label: string;
  year: number;
  month: number;
  total: number;
}

export function monthlySpendTrend(
  subscriptions: (AnalyzableSubscription & { createdAt?: Date })[],
  months: number,
  now: Date = new Date()
): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    points.push({
      label: d.toLocaleString("en", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      total: 0,
    });
  }
  for (const s of subscriptions) {
    const amount = monthlyAmount(s.priceCurrent, s.billingCycle);
    const since = s.createdAt ?? new Date(0);
    for (const point of points) {
      const monthEnd = new Date(point.year, point.month + 1, 0, 23, 59, 59);
      if (since <= monthEnd) point.total += amount;
    }
  }
  return points;
}

export interface CalendarRenewal {
  date: Date;
  name: string;
  currency: string;
  price: number;
}

export function renewalsForMonth(
  subscriptions: AnalyzableSubscription[],
  year: number,
  month: number
): CalendarRenewal[] {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const renewals: CalendarRenewal[] = [];
  for (const s of subscriptions) {
    for (const date of renewalDatesInRange(s, start, end)) {
      renewals.push({
        date,
        name: s.name,
        currency: s.currency,
        price: s.priceCurrent,
      });
    }
  }
  return renewals.sort((a, b) => a.date.getTime() - b.date.getTime());
}
