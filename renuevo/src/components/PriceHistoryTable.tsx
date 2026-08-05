import { format } from "date-fns";
import { formatMoney } from "@/lib/format";

export default function PriceHistoryTable({
  history,
  currency,
}: {
  history: { id: string; price: { toString(): string }; recordedAt: Date }[];
  currency: string;
}) {
  const rows = history
    .reduce<
      Array<{
        id: string;
        recordedAt: Date;
        price: number;
        change: number | null;
      }>
    >((acc, h, index) => {
      const price = Number(h.price);
      const change = index === 0 ? null : price - acc[index - 1].price;
      return [...acc, { id: h.id, recordedAt: h.recordedAt, price, change }];
    }, [])
    .reverse();

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Price</th>
            <th className="px-4 py-2 font-medium">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2">{format(r.recordedAt, "MMM d, yyyy")}</td>
              <td className="px-4 py-2">{formatMoney(r.price, currency)}</td>
              <td className="px-4 py-2">
                {r.change === null ? (
                  "—"
                ) : r.change > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(r.change, currency)}
                  </span>
                ) : r.change < 0 ? (
                  <span className="text-red-600 dark:text-red-400">
                    -{formatMoney(Math.abs(r.change), currency)}
                  </span>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    no change
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
