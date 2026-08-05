import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { daysUntilText, formatMoney } from "@/lib/format";
import { toggleSubscriptionActive } from "@/actions/subscriptions";
import DeleteButton from "@/components/DeleteButton";

export default async function SubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });
  const today = new Date();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <Link
          href="/subscriptions/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add subscription
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
          No subscriptions yet.{" "}
          <Link
            href="/subscriptions/new"
            className="text-zinc-900 underline dark:text-zinc-100"
          >
            Add your first one
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((s) => {
            const days = differenceInCalendarDays(s.nextRenewalDate, today);
            return (
              <div
                key={s.id}
                className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/subscriptions/${s.id}`}
                    className="font-medium hover:underline"
                  >
                    {s.name}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {s.isActive ? "Active" : "Paused"}
                  </span>
                </div>

                <p className="mt-2 text-lg font-semibold">
                  {formatMoney(Number(s.priceCurrent), s.currency)}
                  <span className="ml-1 text-sm font-normal capitalize text-zinc-500 dark:text-zinc-400">
                    / {s.billingCycle}
                  </span>
                </p>

                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {format(s.nextRenewalDate, "MMM d, yyyy")} ·{" "}
                  {daysUntilText(days)}
                </p>

                {s.category && (
                  <span className="mt-2 inline-block w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {s.category}
                  </span>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <Link
                    href={`/subscriptions/${s.id}`}
                    className="rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </Link>
                  <form action={toggleSubscriptionActive.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {s.isActive ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <span className="ml-auto">
                    <DeleteButton id={s.id} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
