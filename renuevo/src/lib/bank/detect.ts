import { addDays, differenceInCalendarDays } from "date-fns";
import type { BillingCycle } from "@/generated/prisma/enums";
import type { RawBankTransaction } from "./types";

export const MIN_OCCURRENCES = 3;

export type DetectionResult = {
  merchantName: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  nextDueDate: Date;
  priceChanged: boolean;
};

type Cycle = { cycle: BillingCycle; days: number; min: number; max: number };

const CYCLES: Cycle[] = [
  { cycle: "weekly", days: 7, min: 5, max: 10 },
  { cycle: "monthly", days: 30, min: 22, max: 45 },
  { cycle: "quarterly", days: 91, min: 70, max: 120 },
  { cycle: "yearly", days: 365, min: 300, max: 400 },
];

export function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/\*+.*$/, "")
    .trim()
    .replace(/\.(com|net|org|io|app|de|fr|es|it)$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function matchCycle(intervalDays: number): Cycle | null {
  for (const cycle of CYCLES) {
    if (intervalDays >= cycle.min && intervalDays <= cycle.max) return cycle;
  }
  return null;
}

function detectMerchant(
  merchant: string,
  charges: RawBankTransaction[]
): DetectionResult | null {
  if (charges.length < MIN_OCCURRENCES) return null;

  const byAmount = new Map<number, RawBankTransaction[]>();
  for (const charge of charges) {
    const amount = Math.abs(charge.amount);
    const arr = byAmount.get(amount) ?? [];
    arr.push(charge);
    byAmount.set(amount, arr);
  }

  const recurring = [...byAmount.values()].filter(
    (arr) => arr.length >= MIN_OCCURRENCES
  );
  if (recurring.length === 0) return null;

  let current = recurring[0];
  for (const cluster of recurring) {
    const clusterLatest = Math.max(...cluster.map((c) => c.date.getTime()));
    const currentLatest = Math.max(...current.map((c) => c.date.getTime()));
    if (clusterLatest > currentLatest) current = cluster;
  }

  const sorted = [...current].sort((a, b) => a.date.getTime() - b.date.getTime());
  const diffs = sorted
    .slice(1)
    .map((c, i) => differenceInCalendarDays(c.date, sorted[i].date));
  if (diffs.length === 0) return null;

  const interval = median(diffs);
  if (interval <= 0) return null;

  const cycle = matchCycle(interval);
  if (!cycle) return null;

  const lastSeen = sorted[sorted.length - 1].date;

  return {
    merchantName: merchant,
    amount: Math.abs(current[0].amount),
    currency: current[0].currency,
    billingCycle: cycle.cycle,
    occurrences: current.length,
    firstSeen: sorted[0].date,
    lastSeen,
    nextDueDate: addDays(lastSeen, cycle.days),
    priceChanged: recurring.length > 1,
  };
}

export function detectRecurring(
  transactions: RawBankTransaction[]
): DetectionResult[] {
  const byMerchant = new Map<string, RawBankTransaction[]>();
  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    const merchant = normalizeMerchant(tx.merchantName);
    const arr = byMerchant.get(merchant) ?? [];
    arr.push(tx);
    byMerchant.set(merchant, arr);
  }

  const results: DetectionResult[] = [];
  for (const [merchant, charges] of byMerchant) {
    const result = detectMerchant(merchant, charges);
    if (result) results.push(result);
  }
  return results;
}