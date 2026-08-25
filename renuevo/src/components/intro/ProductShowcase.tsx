import { formatMoney } from "@/lib/format";

const STATS = [
  { title: "Monthly total", value: "€84.97" },
  { title: "Yearly total", value: "€1,019.64" },
  { title: "Next renewal", value: "Mar 3" },
  { title: "Active", value: "9" },
];

const ROWS = [
  { name: "Spotify", category: "music", price: "€10.99", days: "in 2 days" },
  { name: "Netflix", category: "streaming", price: "€13.49", days: "in 6 days" },
  { name: "Figma", category: "software", price: "€12.00", days: "in 11 days" },
];

const TREND = [72, 74, 79, 78, 82, 84.97];
const MAX = Math.max(...TREND);

export function ProductShowcase() {
  const width = 320;
  const height = 56;
  const pad = 4;
  const step = (width - pad * 2) / (TREND.length - 1);
  const points = TREND.map((v, i) => {
    const x = pad + i * step;
    const y = height - pad - (v / MAX) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="rounded-(--radius-card) bg-carbon p-4 shadow-(--shadow-card-inset)">
      <div className="mb-3 flex items-center gap-1.5 px-1">
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.title}
            className="rounded-(--radius-btn) border border-graphite p-3"
          >
            <p className="text-[11px] text-fog">{s.title}</p>
            <p className="mt-0.5 font-mono text-sm text-paper">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="rounded-(--radius-btn) border border-graphite p-3">
          <p className="text-[11px] text-fog">Monthly spend</p>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-2 w-full text-acid-lime"
            aria-hidden="true"
          >
            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col justify-center rounded-(--radius-btn) border border-graphite px-3 py-1">
          {ROWS.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between border-b border-graphite py-2 last:border-b-0"
            >
              <span className="text-xs text-mist">{r.name}</span>
              <span className="font-mono text-xs text-fog">{r.price}</span>
              <span className="w-16 text-right text-[10px] text-acid-lime">
                {r.days}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only">
        Dashboard preview showing {formatMoney(84.97, "EUR")} monthly total
      </p>
    </div>
  );
}
