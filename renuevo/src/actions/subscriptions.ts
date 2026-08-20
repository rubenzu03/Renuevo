"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { subscriptionSchema } from "@/lib/subscription-validation";
import {
  createSubscription as createSubscriptionRecord,
  deleteSubscription as deleteSubscriptionRecord,
  toggleSubscriptionActive as toggleSubscriptionActiveRecord,
  updateSubscription as updateSubscriptionRecord,
} from "@/lib/subscriptions-service";

export type ActionState =
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "ok" };

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
  await createSubscriptionRecord(result.data);
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

  const updated = await updateSubscriptionRecord(id, result.data);
  if (!updated) return { status: "error", message: "Subscription not found" };

  revalidatePath("/subscriptions");
  redirect(`/subscriptions/${id}`);
}

export async function deleteSubscription(
  id: string,
  _formData: FormData
): Promise<void> {
  await requireAuth();
  await deleteSubscriptionRecord(id);
  revalidatePath("/subscriptions");
  redirect("/subscriptions");
}

export async function toggleSubscriptionActive(
  id: string,
  _formData: FormData
): Promise<void> {
  await requireAuth();
  const updated = await toggleSubscriptionActiveRecord(id);
  if (!updated) redirect("/subscriptions");

  revalidatePath("/subscriptions");
  redirect(`/subscriptions/${id}`);
}