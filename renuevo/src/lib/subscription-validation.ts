import { z } from "zod";

export const BILLING_CYCLES = ["weekly", "monthly", "quarterly", "yearly"] as const;

export const subscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Price: number, up to 2 decimals"),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, "Currency: 3 uppercase letters"),
  billingCycle: z.enum(BILLING_CYCLES),
  billingIntervalDays: z.string().trim().nullish(),
  nextRenewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  category: z.string().trim().max(50).nullish(),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

export function toDbInput(data: SubscriptionInput) {
  return {
    name: data.name,
    priceCurrent: data.price,
    currency: data.currency,
    billingCycle: data.billingCycle,
    billingIntervalDays: data.billingIntervalDays
      ? Number(data.billingIntervalDays)
      : null,
    nextRenewalDate: new Date(`${data.nextRenewalDate}T00:00:00`),
    category: data.category ?? null,
  };
}