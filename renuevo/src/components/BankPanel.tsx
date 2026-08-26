"use client";

import { format } from "date-fns";
import { connectMockBank, refreshBank } from "@/actions/bank";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
      <Card className="mt-6 flex flex-col gap-4 border border-dashed p-6 shadow-none">
        <div>
          <h2 className="text-[15px] font-[590] tracking-[-0.012em] text-paper">
            Connect a bank account
          </h2>
          <p className="mt-1 max-w-lg text-sm text-fog">
            Pull recent transactions and let Renuevo suggest recurring charges
            as subscriptions. This demo connects to a mock bank - no real
            account is involved.
          </p>
        </div>
        <form action={connectMockBank}>
          <Button type="submit">Connect demo bank</Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-[590] tracking-[-0.012em] text-paper">
              {connection.institutionName}
            </h2>
            <Badge tone="success">Connected</Badge>
          </div>
          <p className="mt-1 text-[13px] text-fog">
            {connection.transactionCount} transactions{" "}
            {connection.syncedAt &&
              `· synced ${format(
                new Date(connection.syncedAt),
                "MMM d, yyyy 'at' HH:mm"
              )}`}
          </p>
        </div>
        <form action={refreshBank.bind(null, connection.id)}>
          <Button type="submit" variant="outline">
            Sync now
          </Button>
        </form>
      </div>
    </Card>
  );
}
