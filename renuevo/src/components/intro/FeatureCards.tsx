const FEATURES = [
  {
    title: "Never miss a renewal",
    description:
      "Renuevo emails you before every renewal - three days ahead, deduplicated, so you always have time to cancel or downgrade.",
    icon: (
      <path d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    ),
  },
  {
    title: "Track every price change",
    description:
      "When a price goes up, the old price is archived automatically. See the full history and exactly how much extra you now pay per year.",
    icon: <path d="M3 17l6-6 4 4 7-7M14 8h6v6" />,
  },
  {
    title: "Detect from your bank",
    description:
      "Connect a bank feed and Renuevo spots recurring charges you forgot about, then suggests them as one-click subscriptions.",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="1" />
        <path d="M3 10h18M7 15h4" />
      </>
    ),
  },
];

export function FeatureCards() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className="rounded-(--radius-card) bg-carbon p-6 shadow-(--shadow-card-inset)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-acid-lime"
            aria-hidden="true"
          >
            {f.icon}
          </svg>
          <h3 className="mt-4 text-base font-[510] tracking-[-0.011em] text-paper">
            {f.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-fog">
            {f.description}
          </p>
        </div>
      ))}
    </div>
  );
}
