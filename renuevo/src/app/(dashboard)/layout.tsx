import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { NavLink } from "@/components/ui/NavLink";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-graphite bg-void/90 backdrop-blur">
        <nav className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/overview"
              className="text-base font-[510] tracking-[-0.011em] text-paper"
            >
              Renuevo
            </Link>
            <div className="flex items-center">
              <NavLink href="/overview" label="Dashboard" />
              <NavLink href="/subscriptions" label="Subscriptions" />
              <NavLink href="/calendar" label="Calendar" />
              <NavLink href="/bank" label="Bank" />
              <NavLink href="/insights" label="Insights" />
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="px-3 py-2 text-[13px] text-fog transition-colors hover:text-paper"
            >
              Log out
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </main>
    </div>
  );
}
