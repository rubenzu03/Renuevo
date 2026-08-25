import type { TrendPoint } from "@/lib/analytics-service";
import { formatMoney } from "@/lib/format";

export function SpendTrendChart({
  points,
  currency,
}: {
  points: TrendPoint[];
  currency: string;
}) {
  const max = Math.max(...points.map((p) => p.total), 0.01);
  const width = 560;
  const height = 150;
  const labelSpace = 18;
  const gap = 8;
  const barWidth = (width - gap * (points.length - 1)) / points.length;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height + labelSpace}`}
        className="w-full"
        role="img"
        aria-label="Monthly spend trend"
      >
        {points.map((p, i) => {
          const h = Math.max((p.total / max) * (height - 24), 2);
          const x = i * (barWidth + gap);
          const y = height - h;
          return (
            <g key={`${p.year}-${p.month}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={3}
                className={
                  i === points.length - 1 ? "fill-acid-lime" : "fill-white/10"
                }
              />
              <text
                x={x + barWidth / 2}
                y={height + 12}
                textAnchor="middle"
                className="fill-fog text-[10px]"
              >
                {p.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="fill-mist text-[10px] font-medium"
              >
                {formatMoney(p.total, currency)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
