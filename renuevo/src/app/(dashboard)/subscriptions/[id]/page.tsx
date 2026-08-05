import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { updateSubscription, toggleSubscriptionActive } from "@/actions/subscriptions";
import SubscriptionForm from "@/components/SubscriptionForm";
import PriceHistoryTable from "@/components/PriceHistoryTable";
import Sparkline from "@/components/Sparkline";
import DeleteButton from "@/components/DeleteButton";

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
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to subscriptions
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">{subscription.name}</h1>
          <div className="flex items-center gap-2">
            <form action={toggleSubscriptionActive.bind(null, subscription.id)}>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {subscription.isActive ? "Pause" : "Resume"}
              </button>
            </form>
            <DeleteButton id={subscription.id} />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-medium">Details</h2>
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
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
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium">Price history</h2>
          {subscription.priceHistories.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              No price changes recorded yet.
            </p>
          ) : (
            <>
              <div className="mt-3">
                <Sparkline
                  history={subscription.priceHistories}
                  currency={subscription.currency}
                />
              </div>
              <div className="mt-4">
                <PriceHistoryTable
                  history={subscription.priceHistories}
                  currency={subscription.currency}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
