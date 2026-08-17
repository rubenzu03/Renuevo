import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BankPanel, {
  type BankConnectionView,
} from "@/components/BankPanel";
import SuggestedSubscriptions, {
  type SuggestedSubscriptionView,
} from "@/components/SuggestedSubscriptions";

export const dynamic = "force-dynamic";

export default async function BankPage() {
  const connection = await prisma.bankConnection.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const suggestions = connection
    ? await prisma.suggestedSubscription.findMany({
        where: { connectionId: connection.id },
        orderBy: [{ status: "asc" }, { nextDueDate: "asc" }],
      })
    : [];

  const connectionView: BankConnectionView | null = connection
    ? {
        id: connection.id,
        institutionName: connection.institutionName,
        transactionCount: await prisma.bankTransaction.count({
          where: { connectionId: connection.id },
        }),
        syncedAt: connection.syncedAt?.toISOString() ?? null,
      }
    : null;

  const suggestionViews: SuggestedSubscriptionView[] = suggestions.map((s) => ({
    id: s.id,
    merchantName: s.merchantName,
    amount: s.amount.toString(),
    currency: s.currency,
    billingCycle: s.billingCycle,
    occurrences: s.occurrences,
    firstSeen: s.firstSeen.toISOString(),
    nextDueDate: s.nextDueDate.toISOString(),
    priceChanged: s.priceChanged,
    status: s.status,
  }));

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Bank</h1>
      <BankPanel connection={connectionView} />
      <SuggestedSubscriptions suggestions={suggestionViews} />
    </div>
  );
}