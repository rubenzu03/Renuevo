"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/subscriptions";

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

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

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
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={v.name}
          required
          maxLength={100}
          className={inputClass}
        />
        {fieldError(state, "name")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="block text-sm font-medium">
            Price
          </label>
          <input
            id="price"
            name="price"
            defaultValue={v.price}
            required
            inputMode="decimal"
            step="0.01"
            placeholder="9.99"
            className={inputClass}
          />
          {fieldError(state, "price")}
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium">
            Currency
          </label>
          <input
            id="currency"
            name="currency"
            defaultValue={v.currency}
            required
            maxLength={3}
            placeholder="EUR"
            list="currencies"
            className={inputClass}
          />
          {fieldError(state, "currency")}
          <datalist id="currencies">
            {["EUR", "USD", "GBP", "CHF", "CAD", "AUD", "JPY"].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="billingCycle" className="block text-sm font-medium">
            Billing cycle
          </label>
          <select
            id="billingCycle"
            name="billingCycle"
            defaultValue={v.billingCycle}
            className={inputClass}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label htmlFor="nextRenewalDate" className="block text-sm font-medium">
            Next renewal
          </label>
          <input
            id="nextRenewalDate"
            name="nextRenewalDate"
            type="date"
            defaultValue={v.nextRenewalDate}
            required
            className={inputClass}
          />
          {fieldError(state, "nextRenewalDate")}
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          Category (optional)
        </label>
        <input
          id="category"
          name="category"
          defaultValue={v.category ?? ""}
          list="categories"
          className={inputClass}
        />
        <datalist id="categories">
          {["streaming", "software", "gym", "other"].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      {state.status === "error" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function fieldError(state: ActionState, key: string) {
  if (state.status !== "error" || !state.fieldErrors) return null;
  const errors = state.fieldErrors[key];
  if (!errors || errors.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[0]}</p>
  );
}
