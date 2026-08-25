import Link from "next/link";
import NewSubscriptionFlow from "@/components/NewSubscriptionFlow";
import { Card } from "@/components/ui/Card";

export default function NewSubscriptionPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/subscriptions"
        className="text-[13px] text-fog hover:text-paper"
      >
        ← Back to subscriptions
      </Link>
      <h1 className="mt-2 text-2xl font-normal tracking-[-0.012em] text-paper">
        Add subscription
      </h1>
      <Card className="mt-6 p-6">
        <NewSubscriptionFlow />
      </Card>
    </div>
  );
}
