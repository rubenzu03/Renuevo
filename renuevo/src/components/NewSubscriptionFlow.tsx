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
          className="text-[13px] text-fog hover:text-paper"
        >
          ← Choose another template
        </button>

        {selection.kind === "preset" && (
          <div
            className="mt-4 flex items-center gap-3 rounded-(--radius-card) p-4 text-void"
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
      <p className="text-sm text-fog">
        Pick a service template, or start from scratch.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setSelection({ kind: "preset", preset })}
            className="flex flex-col items-center gap-2 rounded-(--radius-card) p-5 text-center text-void transition-opacity hover:opacity-90"
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
            <span className="text-xs capitalize opacity-70">
              {preset.category}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelection({ kind: "custom" })}
          className="flex flex-col items-center gap-2 rounded-(--radius-card) border border-dashed border-graphite bg-white/[0.02] p-5 text-center transition-colors hover:border-smoke hover:bg-white/[0.04]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-mist"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="font-medium text-paper">Custom</span>
          <span className="text-xs text-fog">Start from scratch</span>
        </button>
      </div>
    </div>
  );
}
