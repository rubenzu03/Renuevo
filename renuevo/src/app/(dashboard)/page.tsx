import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { daysUntilText, formatMoney } from "@/lib/format";
import { monthlyAmount } from "@/lib/money";
import StatCard from "@/components/StatCard";

export default async function DashboardPage() {
  const subscriptions = await prisma.subscription.findMany({
    where: { isActive: true },
    orderBy: { nextRenewalDate: "asc" },
  });

  const monthlyTotal = subscriptions.reduce(
    (sum, s) => sum + monthlyAmount(Number(s.priceCurrent), s.billingCycle),
    0
  );
  const yearlyTotal = monthlyTotal * 12;
  const currency = subscriptions[0]?.currency ?? "EUR";
  const next = subscriptions[0] ?? null;
  const today = new Date();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Monthly total"
            value={formatMoney(monthlyTotal, currency)}
            sub={subscriptions.length === 0 ? undefined : "Active subscriptions"}
          />
          <StatCard
            title="Yearly total"
            value={formatMoney(yearlyTotal, currency)}
          />
          <StatCard
            title="Next renewal"
            value={next ? format(next.nextRenewalDate, "MMM d") : "—"}
            sub={
              next
                ? daysUntilText(
                    differenceInCalendarDays(next.nextRenewalDate, today)
                  )
                : "No active subscriptions"
            }
          />
          <StatCard title="Active" value={String(subscriptions.length)} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Upcoming renewals</h2>
        {subscriptions.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No subscriptions yet.{" "}
            <Link
              href="/subscriptions/new"
              className="text-zinc-900 underline dark:text-zinc-100"
            >
              Add one
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium">Cycle</th>
                  <th className="px-4 py-2 font-medium">Next renewal</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {subscriptions.map((s) => {
                  const days = differenceInCalendarDays(s.nextRenewalDate, today);
                  const soon = days >= 0 && days <= 3;
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-2">
                        <Link
                          href={`/subscriptions/${s.id}`}
                          className="font-medium hover:underline"
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2">
                        {formatMoney(Number(s.priceCurrent), s.currency)}
                      </td>
                      <td className="px-4 py-2 capitalize">{s.billingCycle}</td>
                      <td className="px-4 py-2">
                        {format(s.nextRenewalDate, "MMM d, yyyy")}{" "}
                        <span
                          className={
                            soon
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-500 dark:text-zinc-400"
                          }
                        >
                          · {daysUntilText(days)}
                        </span>
                      </td>
                      <td className="px-4 py-2">{s.category ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
