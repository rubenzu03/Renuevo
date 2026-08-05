import { formatMoney } from "@/lib/format";

export default function Sparkline({
  history,
  currency,
}: {
  history: { price: { toString(): string } }[];
  currency: string;
}) {
  const prices = history.map((h) => Number(h.price));
  if (prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const w = 320;
  const h = 64;
  const pad = 10;
  const step = (w - pad * 2) / (prices.length - 1);
  const points = prices.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - ((p - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full text-zinc-700 dark:text-zinc-200"
      aria-label="Price trend"
      role="img"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={w - pad}
        y={14}
        textAnchor="end"
        className="fill-zinc-500 text-[11px]"
      >
        {formatMoney(prices[prices.length - 1], currency)}
      </text>
    </svg>
  );
}
