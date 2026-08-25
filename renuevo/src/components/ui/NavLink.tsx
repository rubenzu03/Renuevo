"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`px-3 py-2 text-[13px] transition-colors ${
        active
          ? "text-paper underline underline-offset-4"
          : "text-mist hover:text-paper"
      }`}
    >
      {label}
    </Link>
  );
}
