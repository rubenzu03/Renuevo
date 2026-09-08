import { prisma } from "@/lib/prisma";
import BankPanel, {
  type BankConnectionView,
} from "@/components/BankPanel";
import SuggestedSubscriptions, {
  type SuggestedSubscriptionView,
} from "@/components/SuggestedSubscriptions";
import ReceiptUploadForm from "@/components/ReceiptUploadForm";
import { PageHeader } from "@/components/ui/PageHeader";

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
      <PageHeader
        title="Bank"
        subtext="Detect recurring charges and turn them into subscriptions."
      />
      <BankPanel connection={connectionView} />
      <SuggestedSubscriptions suggestions={suggestionViews} />
      <ReceiptUploadForm />
    </div>
  );
}