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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border-b border-graphite px-2 py-2 text-xs font-normal text-fog">
              Date
            </th>
            <th className="border-b border-graphite px-2 py-2 text-xs font-normal text-fog">
              Price
            </th>
            <th className="border-b border-graphite px-2 py-2 text-xs font-normal text-fog">
              Change
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-graphite">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-2 py-2 text-mist">
                {format(r.recordedAt, "MMM d, yyyy")}
              </td>
              <td className="px-2 py-2 font-mono text-mist">
                {formatMoney(r.price, currency)}
              </td>
              <td className="px-2 py-2">
                {r.change === null ? (
                  <span className="text-fog">-</span>
                ) : r.change > 0 ? (
                  <span className="text-coral-red">
                    +{formatMoney(r.change, currency)}
                  </span>
                ) : r.change < 0 ? (
                  <span className="text-pulse-green">
                    -{formatMoney(Math.abs(r.change), currency)}
                  </span>
                ) : (
                  <span className="text-fog">no change</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
