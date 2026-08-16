"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { syncBankAccount } from "@/lib/bank/sync";
import { MOCK_INSTITUTION } from "@/lib/bank/mock";

export async function connectMockBank(): Promise<void> {
  await requireAuth();

  let connection = await prisma.bankConnection.findFirst();
  if (!connection) {
    connection = await prisma.bankConnection.create({
      data: {
        provider: "mock",
        institutionName: MOCK_INSTITUTION,
      },
    });
    await syncBankAccount(connection.id);
  }

  revalidatePath("/");
  revalidatePath("/bank");
  redirect("/bank");
}

export async function refreshBank(
  connectionId: string,
  _formData: FormData
): Promise<void> {
  await requireAuth();
  await syncBankAccount(connectionId);
  revalidatePath("/");
  revalidatePath("/bank");
}

export async function acceptSuggestion(
  suggestionId: string,
  _formData: FormData
): Promise<void> {
  await requireAuth();

  const suggestion = await prisma.suggestedSubscription.findUnique({
    where: { id: suggestionId },
  });
  if (!suggestion) redirect("/bank");

  await prisma.$transaction(async (tx) => {
    await tx.subscription.create({
      data: {
        name: suggestion.merchantName,
        priceCurrent: suggestion.amount,
        currency: suggestion.currency,
        billingCycle: suggestion.billingCycle,
        nextRenewalDate: suggestion.nextDueDate,
      },
    });
    await tx.suggestedSubscription.update({
      where: { id: suggestionId },
      data: { status: "accepted" },
    });
  });

  revalidatePath("/");
  revalidatePath("/bank");
  redirect("/bank");
}

export async function dismissSuggestion(
  suggestionId: string,
  _formData: FormData
): Promise<void> {
  await requireAuth();
  await prisma.suggestedSubscription.update({
    where: { id: suggestionId },
    data: { status: "dismissed" },
  });
  revalidatePath("/bank");
  redirect("/bank");
}