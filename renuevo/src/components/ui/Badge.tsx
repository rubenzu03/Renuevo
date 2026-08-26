import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "success"
  | "danger"
  | "info"
  | "accent"
  | "warn";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-white/5 text-fog",
  success: "bg-pulse-green/10 text-pulse-green",
  danger: "bg-coral-red/10 text-coral-red",
  info: "bg-signal-teal/10 text-signal-teal",
  accent: "bg-iris-violet/15 text-lavender",
  warn: "bg-acid-lime/10 text-acid-lime",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-(--radius-badge) px-1.5 py-0.5 text-xs ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
