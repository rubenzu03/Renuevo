import type { Subscription, PriceHistory } from "@/generated/prisma/client";

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";

export type SubscriptionDTO = {
  id: string;
  name: string;
  priceCurrent: string;
  currency: string;
  billingCycle: BillingCycle;
  billingIntervalDays: number | null;
  nextRenewalDate: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  priceHistory?: PriceHistoryDTO[];
};

export type PriceHistoryDTO = {
  id: string;
  price: string;
  recordedAt: string;
};

type SubscriptionWithHistory = Subscription & {
  priceHistories?: PriceHistory[];
};

export function serializeSubscription(
  sub: SubscriptionWithHistory
): SubscriptionDTO {
  return {
    id: sub.id,
    name: sub.name,
    priceCurrent: sub.priceCurrent.toString(),
    currency: sub.currency,
    billingCycle: sub.billingCycle,
    billingIntervalDays: sub.billingIntervalDays,
    nextRenewalDate: sub.nextRenewalDate.toISOString(),
    category: sub.category,
    isActive: sub.isActive,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
    ...(sub.priceHistories
      ? { priceHistory: sub.priceHistories.map(serializePriceHistory) }
      : {}),
  };
}

export function serializePriceHistory(h: PriceHistory): PriceHistoryDTO {
  return {
    id: h.id,
    price: h.price.toString(),
    recordedAt: h.recordedAt.toISOString(),
  };
}