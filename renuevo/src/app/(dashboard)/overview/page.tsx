import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { daysUntilText, formatMoney } from "@/lib/format";
import {
  categoryBreakdown,
  monthlySpendTrend,
} from "@/lib/analytics-service";
import StatCard from "@/components/StatCard";
import { SpendTrendChart } from "@/components/SpendTrendChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/PageHeader";

export default async function DashboardPage() {
  const subscriptions = await prisma.subscription.findMany({
    where: { isActive: true },
    orderBy: { nextRenewalDate: "asc" },
  });

  const currency = subscriptions[0]?.currency ?? "EUR";
  const next = subscriptions[0] ?? null;
  const today = new Date();

  const analyzable = subscriptions.map((s) => ({
    name: s.name,
    priceCurrent: Number(s.priceCurrent),
    currency: s.currency,
    billingCycle: s.billingCycle as string,
    nextRenewalDate: s.nextRenewalDate,
    category: s.category,
    createdAt: s.createdAt,
  }));

  const trend = monthlySpendTrend(analyzable, 6);
  const categories = categoryBreakdown(analyzable);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-normal tracking-[-0.012em] text-paper">
            Overview
          </h1>
          <ButtonLink href="/subscriptions/new" variant="primary">
            Add subscription
          </ButtonLink>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Monthly total"
            value={formatMoney(trend[trend.length - 1]?.total ?? 0, currency)}
            sub={
              subscriptions.length === 0 ? undefined : "Normalized to monthly"
            }
          />
          <StatCard
            title="Yearly total"
            value={formatMoney((trend[trend.length - 1]?.total ?? 0) * 12, currency)}
          />
          <StatCard
            title="Next renewal"
            value={next ? format(next.nextRenewalDate, "MMM d") : "-"}
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

      {subscriptions.length > 0 && (
        <section className="grid gap-3 lg:grid-cols-5">
          <Card className="p-6 lg:col-span-3">
            <h2 className="mb-4 text-[13px] text-fog">Monthly spend · 6 months</h2>
            <SpendTrendChart points={trend} currency={currency} />
          </Card>
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-4 text-[13px] text-fog">By category</h2>
            <CategoryBreakdown slices={categories} />
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-[15px] font-[590] tracking-[-0.012em] text-paper">
          Upcoming renewals
        </h2>
        {subscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions yet"
            description="Track recurring costs and get notified before every renewal."
            action={
              <ButtonLink href="/subscriptions/new">Add your first</ButtonLink>
            }
          />
        ) : (
          <Card className="divide-y divide-graphite overflow-hidden px-0 py-0">
            {subscriptions.map((s) => {
              const days = differenceInCalendarDays(s.nextRenewalDate, today);
              const tone: BadgeTone =
                days < 0 ? "danger" : days <= 3 ? "warn" : "neutral";
              return (
                <Link
                  key={s.id}
                  href={`/subscriptions/${s.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="truncate text-sm text-paper">{s.name}</span>
                    {s.category ? (
                      <Badge>{s.category}</Badge>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="font-mono text-sm text-mist">
                      {formatMoney(Number(s.priceCurrent), s.currency)}
                    </span>
                    <span className="hidden w-28 text-right text-xs capitalize text-fog sm:inline">
                      {s.billingCycle}
                    </span>
                    <Badge tone={tone}>{daysUntilText(days)}</Badge>
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
