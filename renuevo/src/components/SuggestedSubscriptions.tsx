"use client";

import { format } from "date-fns";
import { formatMoney } from "@/lib/format";
import { acceptSuggestion, dismissSuggestion } from "@/actions/bank";

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
      <h2 className="text-lg font-medium">Suggested subscriptions</h2>
      {suggestions.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          No recurring charges detected yet. Connect a bank account or sync to
          scan for them.
        </p>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mt-3 flex flex-col gap-3">
              {pending.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{s.merchantName}</p>
                      {s.priceChanged && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                          Price changed
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatMoney(Number(s.amount), s.currency)}{" "}
                      <span className="capitalize">/ {s.billingCycle}</span> ·{" "}
                      {s.occurrences} charges · next{" "}
                      {format(new Date(s.nextDueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={acceptSuggestion.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      >
                        Accept
                      </button>
                    </form>
                    <form action={dismissSuggestion.bind(null, s.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Dismiss
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Reviewed
              </h3>
              <ul className="mt-2 flex flex-col gap-2">
                {resolved.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  >
                    <span>
                      {s.merchantName} ·{" "}
                      {formatMoney(Number(s.amount), s.currency)}
                    </span>
                    <span className="capitalize">{s.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}