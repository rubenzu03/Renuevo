"use client";

import { deleteSubscription } from "@/actions/subscriptions";
import { Button } from "@/components/ui/Button";

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
      <Button type="submit" variant="danger">
        Delete
      </Button>
    </form>
  );
}
