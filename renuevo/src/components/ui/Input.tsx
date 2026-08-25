import type { ComponentProps } from "react";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={`w-full rounded-(--radius-input) border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-sm text-mist placeholder:text-fog/60 focus:border-mist focus:outline-none ${className}`}
    />
  );
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={`w-full appearance-none rounded-(--radius-input) border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-sm text-mist focus:border-mist focus:outline-none ${className}`}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] text-fog">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-coral-red">{error}</p> : null}
    </div>
  );
}
