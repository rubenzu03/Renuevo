import { addDays } from "date-fns";
import { monthlyAmount } from "@/lib/money";
import {
  renewalDatesInRange,
  type AnalyzableSubscription,
} from "./analytics-service";

export interface InsightSubscription extends AnalyzableSubscription {
  priceHistories?: { price: number; recordedAt: Date }[];
}

export interface TopSpender {
  name: string;
  monthly: number;
  price: number;
  currency: string;
  billingCycle: string;
}

export function topSpenders(
  subscriptions: InsightSubscription[],
  limit = 5
): TopSpender[] {
  return subscriptions
    .map((s) => ({
      name: s.name,
      monthly: monthlyAmount(s.priceCurrent, s.billingCycle),
      price: s.priceCurrent,
      currency: s.currency,
      billingCycle: s.billingCycle,
    }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, limit);
}

export interface CycleSplit {
  cycle: string;
  count: number;
  monthly: number;
}

export function spendingByCycle(
  subscriptions: InsightSubscription[]
): CycleSplit[] {
  const groups = new Map<string, CycleSplit>();
  for (const s of subscriptions) {
    const existing = groups.get(s.billingCycle);
    if (existing) {
      existing.count += 1;
      existing.monthly += monthlyAmount(s.priceCurrent, s.billingCycle);
    } else {
      groups.set(s.billingCycle, {
        cycle: s.billingCycle,
        count: 1,
        monthly: monthlyAmount(s.priceCurrent, s.billingCycle),
      });
    }
  }
  return [...groups.values()].sort((a, b) => b.monthly - a.monthly);
}

export interface OutflowForecast {
  total: number;
  currency: string;
  renewals: number;
}

export function forecastOutflow(
  subscriptions: InsightSubscription[],
  days: number,
  now: Date = new Date()
): OutflowForecast {
  const currency = subscriptions[0]?.currency ?? "EUR";
  const end = addDays(now, days);
  let total = 0;
  let renewals = 0;
  for (const s of subscriptions) {
    const dates = renewalDatesInRange(s, now, end);
    renewals += dates.length;
    total += dates.length * s.priceCurrent;
  }
  return { total: Math.round(total * 100) / 100, currency, renewals };
}

export interface PriceHike {
  name: string;
  oldPrice: number;
  newPrice: number;
  increasePct: number;
  currency: string;
  recordedAt: Date;
}

export function priceHikes(subscriptions: InsightSubscription[]): PriceHike[] {
  const hikes: PriceHike[] = [];
  for (const s of subscriptions) {
    const histories = [...(s.priceHistories ?? [])].sort(
      (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
    );
    if (histories.length === 0) continue;
    const oldest = histories[0].price;
    if (oldest <= 0 || s.priceCurrent <= oldest) continue;
    hikes.push({
      name: s.name,
      oldPrice: oldest,
      newPrice: s.priceCurrent,
      increasePct:
        Math.round(((s.priceCurrent - oldest) / oldest) * 1000) / 10,
      currency: s.currency,
      recordedAt: histories[histories.length - 1].recordedAt,
    });
  }
  return hikes.sort((a, b) => b.increasePct - a.increasePct);
}

export interface WasteCandidate {
  name: string;
  reason: string;
  monthly: number;
  currency: string;
}

export function wasteCandidates(
  subscriptions: InsightSubscription[]
): WasteCandidate[] {
  const candidates: WasteCandidate[] = [];
  const byName = new Map<string, InsightSubscription[]>();
  for (const s of subscriptions) {
    const key = s.name.toLowerCase().trim().replace(/\s+/g, " ");
    const arr = byName.get(key) ?? [];
    arr.push(s);
    byName.set(key, arr);
  }
  for (const group of byName.values()) {
    if (group.length > 1) {
      candidates.push({
        name: group[0].name,
        reason: `Possible duplicate (${group.length} entries)`,
        monthly: group.reduce(
          (sum, s) => sum + monthlyAmount(s.priceCurrent, s.billingCycle),
          0
        ),
        currency: group[0].currency,
      });
    }
  }
  for (const s of subscriptions) {
    if (s.billingCycle === "weekly") {
      candidates.push({
        name: s.name,
        reason: "Billed weekly - a longer cycle may be cheaper",
        monthly: monthlyAmount(s.priceCurrent, s.billingCycle),
        currency: s.currency,
      });
    }
  }
  return candidates.sort((a, b) => b.monthly - a.monthly);
}
