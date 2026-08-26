import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "pill" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-acid-lime text-void font-[510] tracking-[-0.011em] shadow-(--shadow-lime) hover:brightness-95",
  outline:
    "border border-graphite text-mist hover:border-smoke hover:bg-white/[0.03]",
  ghost: "text-mist hover:bg-white/[0.05]",
  pill: "rounded-full bg-paper text-void font-medium hover:brightness-90",
  danger:
    "border border-graphite text-coral-red hover:border-coral-red/50 hover:bg-coral-red/10",
};

function baseClasses(variant: Variant) {
  const shape =
    variant === "pill"
      ? "rounded-full px-4 py-2 text-[13px]"
      : "rounded-(--radius-btn) px-3 py-2 text-[13px]";
  return `inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 ${shape} ${variantClasses[variant]}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button {...props} className={`${baseClasses(variant)} ${className}`} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={baseClasses(variant)}>
      {children}
    </Link>
  );
}
