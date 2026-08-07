"use client";

import { useState } from "react";
import Image from "next/image";
import { createSubscription } from "@/actions/subscriptions";
import { PRESETS, type Preset } from "@/lib/presets";
import SubscriptionForm, {
  type SubscriptionFormValues,
} from "@/components/SubscriptionForm";

type Selection = { kind: "preset"; preset: Preset } | { kind: "custom" } | null;

function gradient(color: string): string {
  return `linear-gradient(135deg, color-mix(in srgb, ${color} 75%, white), color-mix(in srgb, ${color} 40%, white))`;
}

export default function NewSubscriptionFlow() {
  const [selection, setSelection] = useState<Selection>(null);

  if (selection) {
    const initial: SubscriptionFormValues | null =
      selection.kind === "preset"
        ? {
            name: selection.preset.name,
            price: "",
            currency: "",
            billingCycle: selection.preset.billingCycle,
            nextRenewalDate: "",
            category: selection.preset.category,
          }
        : null;

    return (
      <div>
        <button
          type="button"
          onClick={() => setSelection(null)}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Choose another template
        </button>

        {selection.kind === "preset" && (
          <div
            className="mt-4 flex items-center gap-3 rounded-lg p-4 text-zinc-900"
            style={{ backgroundImage: gradient(selection.preset.color) }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
              <Image
                src={selection.preset.logo}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
            </span>
            <div>
              <p className="font-medium">{selection.preset.name}</p>
              <p className="text-xs capitalize text-zinc-600">
                {selection.preset.category}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <SubscriptionForm
            key={selection.kind === "preset" ? selection.preset.id : "custom"}
            action={createSubscription}
            submitLabel="Add subscription"
            initial={initial}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Pick a service template, or start from scratch.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setSelection({ kind: "preset", preset })}
            className="flex flex-col items-center gap-2 rounded-lg p-5 text-center text-zinc-900 transition-shadow hover:shadow-md"
            style={{ backgroundImage: gradient(preset.color) }}
          >
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white">
              <Image
                src={preset.logo}
                alt={`${preset.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 object-cover"
              />
            </span>
            <span className="font-medium">{preset.name}</span>
            <span className="text-xs capitalize text-zinc-600">
              {preset.category}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelection({ kind: "custom" })}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white p-5 text-center hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-zinc-600 dark:text-zinc-300"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-medium">Custom</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Start from scratch
          </span>
        </button>
      </div>
    </div>
  );
}
