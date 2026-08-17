"use client";

import { format } from "date-fns";
import { connectMockBank, refreshBank } from "@/actions/bank";

export type BankConnectionView = {
  id: string;
  institutionName: string;
  transactionCount: number;
  syncedAt: string | null;
};

export default function BankPanel({
  connection,
}: {
  connection: BankConnectionView | null;
}) {
  if (!connection) {
    return (
      <section className="mt-6 flex flex-col gap-4 rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
        <div>
          <h2 className="text-lg font-medium">Connect a bank account</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pull recent transactions and let Renuevo suggest recurring charges
            as subscriptions. This demo connects to a mock bank — no real
            account is involved.
          </p>
        </div>
        <form action={connectMockBank} className="flex">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Connect demo bank
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mt-6 flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{connection.institutionName}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {connection.transactionCount} transactions{" "}
            {connection.syncedAt &&
              `· synced ${format(
                new Date(connection.syncedAt),
                "MMM d, yyyy 'at' HH:mm"
              )}`}
          </p>
        </div>
        <form action={refreshBank.bind(null, connection.id)}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Sync now
          </button>
        </form>
      </div>
    </section>
  );
}