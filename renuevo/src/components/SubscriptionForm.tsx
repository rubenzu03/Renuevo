"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/subscriptions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";

export type SubscriptionFormValues = {
  name: string;
  price: string;
  currency: string;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly";
  nextRenewalDate: string;
  category: string | null;
};

const EMPTY: SubscriptionFormValues = {
  name: "",
  price: "",
  currency: "",
  billingCycle: "monthly",
  nextRenewalDate: "",
  category: null,
};

export default function SubscriptionForm({
  action,
  initial,
  submitLabel = "Save",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: SubscriptionFormValues | null;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    status: "ok",
  });
  const v = initial ?? EMPTY;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field label="Name" htmlFor="name" error={fieldError(state, "name")}>
        <Input id="name" name="name" defaultValue={v.name} required maxLength={100} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price" htmlFor="price" error={fieldError(state, "price")}>
          <Input
            id="price"
            name="price"
            defaultValue={v.price}
            required
            inputMode="decimal"
            step="0.01"
            placeholder="9.99"
          />
        </Field>
        <Field label="Currency" htmlFor="currency" error={fieldError(state, "currency")}>
          <Input
            id="currency"
            name="currency"
            defaultValue={v.currency}
            required
            maxLength={3}
            placeholder="EUR"
            list="currencies"
          />
          <datalist id="currencies">
            {["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY"].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Billing cycle" htmlFor="billingCycle">
          <Select
            id="billingCycle"
            name="billingCycle"
            defaultValue={v.billingCycle}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </Field>
        <Field label="Next renewal" htmlFor="nextRenewalDate" error={fieldError(state, "nextRenewalDate")}>
          <Input
            id="nextRenewalDate"
            name="nextRenewalDate"
            type="date"
            defaultValue={v.nextRenewalDate}
            required
          />
        </Field>
      </div>

      <Field label="Category (optional)" htmlFor="category">
        <Input
          id="category"
          name="category"
          defaultValue={v.category ?? ""}
          list="categories"
        />
        <datalist id="categories">
          {["streaming", "software", "gym", "other"].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      {state.status === "error" && (
        <p className="rounded-(--radius-input) bg-coral-red/10 px-3 py-2 text-sm text-coral-red">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

function fieldError(state: ActionState, key: string) {
  if (state.status !== "error" || !state.fieldErrors) return null;
  const errors = state.fieldErrors[key];
  if (!errors || errors.length === 0) return null;
  return errors[0];
}
