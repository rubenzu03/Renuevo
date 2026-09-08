import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { monthlyAmount } from "@/lib/money";
import {
  forecastOutflow,
  priceHikes,
  spendingByCycle,
  topSpenders,
  wasteCandidates,
  type InsightSubscription,
} from "@/lib/insights";
import StatCard from "@/components/StatCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const rows = await prisma.subscription.findMany({
    where: { isActive: true },
    include: { priceHistories: true },
    orderBy: { priceCurrent: "desc" },
  });

  const subscriptions: InsightSubscription[] = rows.map((s) => ({
    name: s.name,
    priceCurrent: Number(s.priceCurrent),
    currency: s.currency,
    billingCycle: s.billingCycle as string,
    nextRenewalDate: s.nextRenewalDate,
    category: s.category,
    priceHistories: s.priceHistories.map((h) => ({
      price: Number(h.price),
      recordedAt: h.recordedAt,
    })),
  }));

  if (subscriptions.length === 0) {
    return (
      <div>
        <PageHeader
          title="Insights"
          subtext="Where your recurring money goes, and what to do about it."
        />
        <EmptyState
          title="No subscriptions yet"
          description="Add subscriptions to unlock spending insights, forecasts and waste detection."
          action={<ButtonLink href="/subscriptions/new">Add your first</ButtonLink>}
        />
      </div>
    );
  }

  const currency = subscriptions[0].currency;
  const now = new Date();
  const monthlyTotal = subscriptions.reduce(
    (sum, s) => sum + monthlyAmount(s.priceCurrent, s.billingCycle),
    0
  );
  const forecast30 = forecastOutflow(subscriptions, 30, now);
  const forecast90 = forecastOutflow(subscriptions, 90, now);
  const top = topSpenders(subscriptions);
  const cycles = spendingByCycle(subscriptions);
  const hikes = priceHikes(subscriptions);
  const waste = wasteCandidates(subscriptions);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Insights"
        subtext="Where your recurring money goes, and what to do about it."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly total"
          value={formatMoney(monthlyTotal, currency)}
          sub="Normalized to monthly"
        />
        <StatCard
          title="Next 30 days"
          value={formatMoney(forecast30.total, currency)}
          sub={`${forecast30.renewals} renewals`}
        />
        <StatCard
          title="Next 90 days"
          value={formatMoney(forecast90.total, currency)}
          sub={`${forecast90.renewals} renewals`}
        />
        <StatCard
          title="Price hikes"
          value={String(hikes.length)}
          sub={
            hikes.length === 0
              ? "No increases detected"
              : "Since first record"
          }
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-[13px] text-fog">Top spenders · monthly</h2>
          <ul className="flex flex-col gap-3">
            {top.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-paper">{s.name}</p>
                  <p className="text-xs capitalize text-fog">
                    {formatMoney(s.price, s.currency)} {s.billingCycle}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm text-mist">
                  {formatMoney(s.monthly, s.currency)}/mo
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-[13px] text-fog">By billing cycle</h2>
          <ul className="flex flex-col gap-3">
            {cycles.map((c) => (
              <li
                key={c.cycle}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm capitalize text-paper">
                    {c.cycle}
                  </span>
                  <Badge>
                    {c.count} {c.count === 1 ? "sub" : "subs"}
                  </Badge>
                </div>
                <span className="shrink-0 font-mono text-sm text-mist">
                  {formatMoney(c.monthly, currency)}/mo
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-[590] tracking-[-0.012em] text-paper">
          Price hikes
        </h2>
        {hikes.length === 0 ? (
          <EmptyState
            title="No price hikes"
            description="None of your subscriptions cost more than when first recorded."
          />
        ) : (
          <Card className="divide-y divide-graphite overflow-hidden px-0 py-0">
            {hikes.map((h) => (
              <div
                key={h.name}
                className="flex items-center justify-between gap-4 px-6 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-paper">{h.name}</p>
                  <p className="font-mono text-xs text-fog">
                    {formatMoney(h.oldPrice, h.currency)} →{" "}
                    {formatMoney(h.newPrice, h.currency)}
                  </p>
                </div>
                <Badge tone={h.increasePct >= 20 ? "danger" : "warn"}>
                  +{h.increasePct}%
                </Badge>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-[590] tracking-[-0.012em] text-paper">
          Possible waste
        </h2>
        {waste.length === 0 ? (
          <EmptyState
            title="Nothing wasteful detected"
            description="No duplicates or high-frequency billing found."
          />
        ) : (
          <Card className="divide-y divide-graphite overflow-hidden px-0 py-0">
            {waste.map((w) => (
              <div
                key={`${w.name}-${w.reason}`}
                className="flex items-center justify-between gap-4 px-6 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-paper">{w.name}</p>
                  <p className="text-xs text-fog">{w.reason}</p>
                </div>
                <span className="shrink-0 font-mono text-sm text-mist">
                  {formatMoney(w.monthly, w.currency)}/mo
                </span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
