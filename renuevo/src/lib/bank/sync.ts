import { prisma } from "@/lib/prisma";
import { createBankProvider } from "./index";
import { detectRecurring } from "./detect";

export type SyncResult = {
  transactions: number;
  suggestions: number;
};

export async function syncBankAccount(
  connectionId: string,
  now = new Date()
): Promise<SyncResult> {
  const connection = await prisma.bankConnection.findUnique({
    where: { id: connectionId },
  });
  if (!connection) throw new Error("Bank connection not found");

  const provider = createBankProvider(connectionId, now);
  const transactions = await provider.fetchTransactions();

  const seen = new Set<string>();
  const unique = transactions.filter((tx) => {
    if (seen.has(tx.externalId)) return false;
    seen.add(tx.externalId);
    return true;
  });

  await prisma.$transaction([
    ...unique.map((tx) =>
      prisma.bankTransaction.upsert({
        where: {
          connectionId_externalId: {
            connectionId,
            externalId: tx.externalId,
          },
        },
        create: {
          connectionId,
          externalId: tx.externalId,
          merchantName: tx.merchantName,
          amount: tx.amount,
          currency: tx.currency,
          date: tx.date,
        },
        update: {},
      })
    ),
    prisma.bankConnection.update({
      where: { id: connectionId },
      data: { status: "connected", syncedAt: now },
    }),
  ]);

  const detected = detectRecurring(unique);
  for (const d of detected) {
    const existing = await prisma.suggestedSubscription.findUnique({
      where: {
        connectionId_merchantName: {
          connectionId,
          merchantName: d.merchantName,
        },
      },
    });

    if (existing && existing.status === "dismissed") continue;

    await prisma.suggestedSubscription.upsert({
      where: {
        connectionId_merchantName: {
          connectionId,
          merchantName: d.merchantName,
        },
      },
      create: {
        connectionId,
        merchantName: d.merchantName,
        amount: d.amount,
        currency: d.currency,
        billingCycle: d.billingCycle,
        occurrences: d.occurrences,
        firstSeen: d.firstSeen,
        nextDueDate: d.nextDueDate,
        priceChanged: d.priceChanged,
      },
      update: {
        amount: d.amount,
        currency: d.currency,
        billingCycle: d.billingCycle,
        occurrences: d.occurrences,
        firstSeen: d.firstSeen,
        nextDueDate: d.nextDueDate,
        priceChanged: d.priceChanged,
      },
    });
  }

  return {
    transactions: unique.length,
    suggestions: detected.length,
  };
}