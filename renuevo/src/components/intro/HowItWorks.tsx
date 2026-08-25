const STEPS = [
  {
    step: "01",
    title: "Add your subscriptions",
    description:
      "Start from a template or from scratch - name, price, cycle, next renewal date.",
  },
  {
    step: "02",
    title: "Get warned in advance",
    description:
      "A daily check emails you before each renewal and whenever a price changes.",
  },
  {
    step: "03",
    title: "Let your bank do the rest",
    description:
      "Connect the mock or Plaid bank provider to surface subscriptions you didn't even remember.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {STEPS.map((s) => (
        <div key={s.step} className="border-t border-graphite pt-4">
          <span className="font-mono text-xs text-acid-lime">{s.step}</span>
          <h3 className="mt-2 text-[15px] font-[510] tracking-[-0.011em] text-paper">
            {s.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-fog">
            {s.description}
          </p>
        </div>
      ))}
    </div>
  );
}
