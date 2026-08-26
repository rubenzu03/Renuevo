import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { daysUntilText, formatMoney } from "@/lib/format";
import { toggleSubscriptionActive } from "@/actions/subscriptions";
import DeleteButton from "@/components/DeleteButton";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/PageHeader";

export default async function SubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        actions={
          <ButtonLink href="/subscriptions/new">Add subscription</ButtonLink>
        }
      />

      {subscriptions.length === 0 ? (
        <EmptyState
          title="No subscriptions yet"
          description="Track recurring costs and get notified before every renewal."
          action={
            <ButtonLink href="/subscriptions/new">
              Add your first one
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((s) => {
            const days = differenceInCalendarDays(s.nextRenewalDate, today);
            const statusTone: BadgeTone = s.isActive ? "success" : "neutral";
            return (
              <Card key={s.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/subscriptions/${s.id}`}
                    className="text-sm font-medium text-paper hover:underline"
                  >
                    {s.name}
                  </Link>
                  <Badge tone={statusTone}>
                    {s.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>

                <p className="mt-2 font-mono text-lg text-paper">
                  {formatMoney(Number(s.priceCurrent), s.currency)}
                  <span className="ml-1 font-sans text-[13px] capitalize text-fog">
                    / {s.billingCycle}
                  </span>
                </p>

                <p className="mt-1 text-[13px] text-fog">
                  {format(s.nextRenewalDate, "MMM d, yyyy")} ·{" "}
                  {daysUntilText(days)}
                </p>

                {s.category && (
                  <span className="mt-3 w-fit">
                    <Badge tone="accent">{s.category}</Badge>
                  </span>
                )}

                <div className="flex-1" />

                <div className="mt-4 flex items-center gap-1 border-t border-graphite pt-3">
                  <Link
                    href={`/subscriptions/${s.id}`}
                    className="rounded-(--radius-btn) px-3 py-1.5 text-[13px] text-mist hover:bg-white/5"
                  >
                    Edit
                  </Link>
                  <form action={toggleSubscriptionActive.bind(null, s.id)}>
                    <Button type="submit" variant="ghost">
                      {s.isActive ? "Pause" : "Resume"}
                    </Button>
                  </form>
                  <span className="ml-auto">
                    <DeleteButton id={s.id} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
