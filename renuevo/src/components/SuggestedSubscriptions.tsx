"use client";

import { format } from "date-fns";
import { formatMoney } from "@/lib/format";
import { acceptSuggestion, dismissSuggestion } from "@/actions/bank";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/PageHeader";

export type SuggestedSubscriptionView = {
  id: string;
  merchantName: string;
  amount: string;
  currency: string;
  billingCycle: string;
  occurrences: number;
  firstSeen: string;
  nextDueDate: string;
  priceChanged: boolean;
  status: "pending" | "accepted" | "dismissed";
};

export default function SuggestedSubscriptions({
  suggestions,
}: {
  suggestions: SuggestedSubscriptionView[];
}) {
  const pending = suggestions.filter((s) => s.status === "pending");
  const resolved = suggestions.filter((s) => s.status !== "pending");

  return (
    <section className="mt-8">
      <h2 className="text-[15px] font-[590] tracking-[-0.012em] text-paper">
        Suggested subscriptions
      </h2>
      {suggestions.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="No recurring charges detected"
            description="Connect a bank account or sync to scan for recurring charges."
          />
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mt-3 flex flex-col gap-3">
              {pending.map((s) => (
                <Card key={s.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-paper">
                          {s.merchantName}
                        </p>
                        {s.priceChanged && <Badge tone="warn">Price changed</Badge>}
                      </div>
                      <p className="mt-1 text-[13px] text-fog">
                        <span className="font-mono text-mist">
                          {formatMoney(Number(s.amount), s.currency)}
                        </span>{" "}
                        <span className="capitalize">/ {s.billingCycle}</span> ·{" "}
                        {s.occurrences} charges · next{" "}
                        {format(new Date(s.nextDueDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={acceptSuggestion.bind(null, s.id)}>
                        <Button type="submit">Accept</Button>
                      </form>
                      <form action={dismissSuggestion.bind(null, s.id)}>
                        <Button type="submit" variant="outline">
                          Dismiss
                        </Button>
                      </form>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[13px] text-fog">Reviewed</h3>
              <ul className="mt-2 flex flex-col divide-y divide-graphite rounded-(--radius-card) bg-carbon px-0 shadow-(--shadow-card-inset)">
                {resolved.map((s) => {
                  const tone: BadgeTone =
                    s.status === "accepted" ? "success" : "neutral";
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between px-5 py-3 text-sm text-fog first:rounded-t-(--radius-card) last:rounded-b-(--radius-card)"
                    >
                      <span className="font-mono text-xs text-mist">
                        {s.merchantName} ·{" "}
                        {formatMoney(Number(s.amount), s.currency)}
                      </span>
                      <Badge tone={tone}>{s.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
