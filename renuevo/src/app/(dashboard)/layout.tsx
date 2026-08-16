import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/60 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              Renuevo
            </Link>
            <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <Link
                href="/"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Dashboard
              </Link>
              <Link
                href="/subscriptions"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Subscriptions
              </Link>
              <Link
                href="/bank"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Bank
              </Link>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Log out
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
