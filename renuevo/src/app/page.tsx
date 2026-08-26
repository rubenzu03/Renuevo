import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IntroNav } from "@/components/intro/IntroNav";
import { ProductShowcase } from "@/components/intro/ProductShowcase";
import { FeatureCards } from "@/components/intro/FeatureCards";
import { HowItWorks } from "@/components/intro/HowItWorks";
import { IntroFooter } from "@/components/intro/IntroFooter";
import LoginForm from "@/components/LoginForm";

export default async function IntroductionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await isAuthenticated()) redirect("/overview");
  const { next } = await searchParams;

  return (
    <div className="relative flex min-h-full flex-col">
      <IntroNav />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-36">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h1 className="text-5xl font-[510] leading-[1.02] tracking-[-0.022em] text-paper md:text-[64px]">
                Know exactly where your money recurs.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-fog">
                Renuevo is a self-hosted subscription tracker. It watches your
                renewals, flags price increases, and digs recurring charges out
                of your bank feed - before they quietly drain your account.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <a
                  href="#signin"
                  className="rounded-(--radius-btn) bg-acid-lime px-4 py-2.5 text-sm font-[510] tracking-[-0.011em] text-void shadow-(--shadow-lime) transition-[filter] hover:brightness-95"
                >
                  Get started
                </a>
                <a
                  href="#features"
                  className="rounded-(--radius-btn) border border-graphite px-4 py-2.5 text-sm text-mist transition-colors hover:border-smoke hover:bg-white/[0.03]"
                >
                  Learn more
                </a>
              </div>
            </div>

            <div id="signin" className="scroll-mt-24">
              <div className="rounded-(--radius-card) bg-carbon p-6 shadow-(--shadow-card-inset)">
                <h2 className="text-lg font-[510] tracking-[-0.012em] text-paper">
                  Sign in
                </h2>
                <p className="mt-1 text-[13px] text-fog">
                  One shared password - no accounts, no email.
                </p>
                <LoginForm next={next} />
              </div>
            </div>
          </div>

          <div className="mt-16 [background:linear-gradient(180deg,rgba(8,9,10,0)_0%,rgba(208,214,224,0.08)_100%)] px-1 pb-6 pt-1 sm:-mx-6 sm:px-6">
            <ProductShowcase />
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 className="text-3xl font-[510] tracking-[-0.022em] text-paper">
            Built for quiet vigilance
          </h2>
          <p className="mt-3 max-w-lg text-base text-fog">
            Everything runs on your own server, with a single shared password -
            no accounts, no third-party analytics.
          </p>
          <div className="mt-8">
            <FeatureCards />
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 className="text-3xl font-[510] tracking-[-0.022em] text-paper">
            How it works
          </h2>
          <div className="mt-8">
            <HowItWorks />
          </div>
          <div className="mt-12 flex flex-col items-start gap-3 rounded-(--radius-card) bg-carbon p-8 shadow-(--shadow-card-inset) sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-[590] tracking-[-0.012em] text-paper">
              Take back control of your recurring costs.
            </p>
            <a
              href="#signin"
              className="shrink-0 rounded-(--radius-btn) bg-acid-lime px-4 py-2.5 text-sm font-[510] tracking-[-0.011em] text-void shadow-(--shadow-lime) transition-[filter] hover:brightness-95"
            >
              Get started
            </a>
          </div>
        </section>
      </main>

      <IntroFooter />
    </div>
  );
}
