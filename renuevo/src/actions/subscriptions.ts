"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const BILLING_CYCLES = ["weekly", "monthly", "quarterly", "yearly"] as const;

const subscriptionSchema = z.object({
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

export type ActionState =
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "ok" };

type SubscriptionInput = z.infer<typeof subscriptionSchema>;

function parseInput(formData: FormData) {
  const parsed = subscriptionSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    billingCycle: formData.get("billingCycle"),
    billingIntervalDays: formData.get("billingIntervalDays") || undefined,
    nextRenewalDate: formData.get("nextRenewalDate"),
    category: formData.get("category") || undefined,
  });
  if (parsed.success) return { data: parsed.data };

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { fieldErrors, message: "Check the form" };
}

function toDbInput(data: SubscriptionInput) {
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

export async function createSubscription(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();
  const result = parseInput(formData);
  if (result.fieldErrors) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    };
  }
  await prisma.subscription.create({
    data: { ...toDbInput(result.data), isActive: true },
  });
  redirect("/subscriptions");
}

export async function updateSubscription(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAuth();
  const result = parseInput(formData);
  if (result.fieldErrors) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    };
  }

  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return { status: "error", message: "Subscription not found" };

  const priceChanged = !existing.priceCurrent.equals(result.data!.price);

  await prisma.$transaction(async (tx) => {
    if (priceChanged) {
      await tx.priceHistory.create({
        data: { subscriptionId: id, price: existing.priceCurrent },
      });
    }
    await tx.subscription.update({
      where: { id },
      data: toDbInput(result.data),
    });
  });

  revalidatePath("/subscriptions");
  redirect(`/subscriptions/${id}`);
}

export async function deleteSubscription(
  id: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  await requireAuth();
  await prisma.subscription.delete({ where: { id } });
  revalidatePath("/subscriptions");
  redirect("/subscriptions");
}

export async function toggleSubscriptionActive(
  id: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  await requireAuth();
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return { status: "error", message: "Subscription not found" };

  await prisma.subscription.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  revalidatePath("/subscriptions");
  redirect(`/subscriptions/${id}`);
}
