import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { updateSubscription, toggleSubscriptionActive } from "@/actions/subscriptions";
import SubscriptionForm from "@/components/SubscriptionForm";
import PriceHistoryTable from "@/components/PriceHistoryTable";
import Sparkline from "@/components/Sparkline";
import DeleteButton from "@/components/DeleteButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { priceHistories: { orderBy: { recordedAt: "asc" } } },
  });
  if (!subscription) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/subscriptions"
          className="text-[13px] text-fog hover:text-paper"
        >
          ← Back to subscriptions
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-normal tracking-[-0.012em] text-paper">
              {subscription.name}
            </h1>
            <Badge tone={subscription.isActive ? "success" : "neutral"}>
              {subscription.isActive ? "Active" : "Paused"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <form action={toggleSubscriptionActive.bind(null, subscription.id)}>
              <Button type="submit" variant="ghost">
                {subscription.isActive ? "Pause" : "Resume"}
              </Button>
            </form>
            <DeleteButton id={subscription.id} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[15px] font-[590] tracking-[-0.012em] text-paper">
            Details
          </h2>
          <Card className="p-6">
            <SubscriptionForm
              action={updateSubscription.bind(null, subscription.id)}
              submitLabel="Save changes"
              initial={{
                name: subscription.name,
                price: subscription.priceCurrent.toString(),
                currency: subscription.currency,
                billingCycle: subscription.billingCycle,
                nextRenewalDate: format(subscription.nextRenewalDate, "yyyy-MM-dd"),
                category: subscription.category,
              }}
            />
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-[590] tracking-[-0.012em] text-paper">
            Price history
          </h2>
          {subscription.priceHistories.length === 0 ? (
            <p className="mt-1 text-sm text-fog">
              No price changes recorded yet.
            </p>
          ) : (
            <>
              <Card className="p-6">
                <Sparkline
                  history={subscription.priceHistories}
                  currency={subscription.currency}
                />
              </Card>
              <Card className="mt-3 p-6">
                <PriceHistoryTable
                  history={subscription.priceHistories}
                  currency={subscription.currency}
                />
              </Card>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
