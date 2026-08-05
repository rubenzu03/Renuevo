import Link from "next/link";
import { createSubscription } from "@/actions/subscriptions";
import SubscriptionForm from "@/components/SubscriptionForm";

export default function NewSubscriptionPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/subscriptions"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back to subscriptions
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Add subscription</h1>
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <SubscriptionForm action={createSubscription} submitLabel="Add subscription" />
      </div>
    </div>
  );
}
