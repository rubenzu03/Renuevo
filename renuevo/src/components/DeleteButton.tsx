"use client";

import { deleteSubscription } from "@/actions/subscriptions";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteSubscription.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm("Delete this subscription?")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </form>
  );
}
