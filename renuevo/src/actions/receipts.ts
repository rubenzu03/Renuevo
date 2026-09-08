"use server";

import { addDays } from "date-fns";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { parseReceiptText } from "@/lib/receipts/parse";
import { createOcrEngine } from "@/lib/receipts/ocr";
import { normalizeMerchant } from "@/lib/bank/detect";
import { MOCK_INSTITUTION } from "@/lib/bank/mock";

export type ReceiptState = { error: string } | null;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadReceiptAction(
  _prev: ReceiptState,
  formData: FormData
): Promise<ReceiptState> {
  await requireAuth();

  let text = String(formData.get("text") ?? "").trim();
  const image = formData.get("image");
  if (!text && image instanceof File && image.size > 0) {
    if (image.size > MAX_IMAGE_BYTES) {
      return { error: "Image is too large (max 5 MB)." };
    }
    try {
      const bytes = new Uint8Array(await image.arrayBuffer());
      text = (await createOcrEngine().extractText(bytes, image.name)).trim();
    } catch {
      return {
        error: "Could not read that image. Paste the receipt text instead.",
      };
    }
  }
  if (!text) return { error: "Add receipt text or an image." };

  const parsed = parseReceiptText(text);
  if (!parsed) {
    return { error: "No merchant or total found on that receipt." };
  }

  let connection = await prisma.bankConnection.findFirst();
  if (!connection) {
    connection = await prisma.bankConnection.create({
      data: { provider: "mock", institutionName: MOCK_INSTITUTION },
    });
  }

  const merchantName = normalizeMerchant(parsed.merchantName);
  const existing = await prisma.suggestedSubscription.findUnique({
    where: {
      connectionId_merchantName: { connectionId: connection.id, merchantName },
    },
  });
  if (existing?.status === "dismissed") {
    return { error: "This merchant was dismissed before." };
  }

  const seen = parsed.purchasedAt ?? new Date();
  await prisma.suggestedSubscription.upsert({
    where: {
      connectionId_merchantName: { connectionId: connection.id, merchantName },
    },
    create: {
      connectionId: connection.id,
      merchantName,
      amount: parsed.amount,
      currency: parsed.currency,
      billingCycle: "monthly",
      occurrences: 1,
      firstSeen: seen,
      nextDueDate: addDays(seen, 30),
      priceChanged: false,
    },
    update: {
      amount: parsed.amount,
      currency: parsed.currency,
      firstSeen: seen,
      nextDueDate: addDays(seen, 30),
    },
  });

  revalidatePath("/bank");
  redirect("/bank");
}
