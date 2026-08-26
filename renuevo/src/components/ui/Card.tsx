import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`rounded-(--radius-card) bg-carbon shadow-(--shadow-card-inset) ${className}`}
    />
  );
}

export function CardHeader({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={`flex items-center justify-between px-6 pt-5 pb-4 ${className}`}
    />
  );
}
