import Link from "next/link";

export function IntroNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-base font-[510] tracking-[-0.011em] text-paper"
        >
          Renuevo
        </Link>
        <div className="flex items-center gap-2">
          <a
            href="#features"
            className="px-3 py-2 text-[13px] text-mist transition-colors hover:text-paper"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="px-3 py-2 text-[13px] text-mist transition-colors hover:text-paper"
          >
            How it works
          </a>
          <Link
            href="#signin"
            className="rounded-full bg-paper px-4 py-1.5 text-[13px] font-[510] text-void transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
