import type { CategorySlice } from "@/lib/analytics-service";
import { formatMoney } from "@/lib/format";

export function CategoryBreakdown({ slices }: { slices: CategorySlice[] }) {
  const max = Math.max(...slices.map((s) => s.total), 0.01);

  return (
    <div className="flex flex-col gap-3">
      {slices.map((slice, i) => (
        <div key={slice.category}>
          <div className="mb-1 flex items-baseline justify-between text-[13px]">
            <span className="text-mist">
              {slice.category}
              <span className="ml-2 text-fog">{slice.count}</span>
            </span>
            <span className="font-mono text-xs text-fog">
              {formatMoney(slice.total, slice.currency)}/mo
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full ${
                i === 0 ? "bg-acid-lime" : "bg-white/25"
              }`}
              style={{ width: `${Math.max((slice.total / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
