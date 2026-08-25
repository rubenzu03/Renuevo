"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? "/overview"} />
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
        />
      </Field>
      {state?.error && (
        <p className="rounded-(--radius-input) bg-coral-red/10 px-3 py-2 text-sm text-coral-red">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
