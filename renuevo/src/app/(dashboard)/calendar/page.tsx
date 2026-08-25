import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { renewalsForMonth } from "@/lib/analytics-service";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const year = clampInt(params.year, today.getFullYear(), 2000, 2100);
  const month = clampInt(params.month, today.getMonth(), 0, 11);
  const view = new Date(year, month, 1);

  const subscriptions = await prisma.subscription.findMany({
    where: { isActive: true },
  });

  const windowStart = startOfWeek(startOfMonth(view));
  const windowEnd = endOfWeek(endOfMonth(view));
  const extended = subscriptions.map((s) => ({
    name: s.name,
    priceCurrent: Number(s.priceCurrent),
    currency: s.currency,
    billingCycle: s.billingCycle as string,
    nextRenewalDate:
      s.nextRenewalDate < windowStart
        ? nextAlignedRenewal(s.nextRenewalDate, s.billingCycle, windowEnd)
        : s.nextRenewalDate,
  }));
  const renewals = renewalsForMonth(extended, view.getFullYear(), view.getMonth());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(view)),
    end: endOfWeek(endOfMonth(view)),
  });

  const prev = new Date(year, month - 1, 1);
  const nextM = new Date(year, month + 1, 1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-normal tracking-[-0.012em] text-paper">
          {format(view, "MMMM yyyy")}
        </h1>
        <div className="flex items-center gap-2">
          <ButtonLink
            href={`/calendar?year=${prev.getFullYear()}&month=${prev.getMonth()}`}
            variant="outline"
          >
            ←
          </ButtonLink>
          <ButtonLink href="/calendar" variant="outline">
            Today
          </ButtonLink>
          <ButtonLink
            href={`/calendar?year=${nextM.getFullYear()}&month=${nextM.getMonth()}`}
            variant="outline"
          >
            →
          </ButtonLink>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-graphite">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-xs font-normal text-fog"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayRenewals = renewals.filter((r) =>
              isSameDay(r.date, day)
            );
            const inMonth = isSameMonth(day, view);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 border-b border-r border-graphite p-2 last:border-r-0 ${
                  inMonth ? "" : "opacity-30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-acid-lime font-medium text-void"
                        : "text-fog"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {dayRenewals.length > 1 && (
                    <span className="font-mono text-[10px] text-fog">
                      ×{dayRenewals.length}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {dayRenewals.slice(0, 3).map((r) => (
                    <div
                      key={`${r.name}-${r.date.toISOString()}`}
                      className="truncate rounded-(--radius-badge) bg-white/5 px-1.5 py-0.5 text-[11px] text-mist"
                      title={`${r.name} · ${formatMoney(r.price, r.currency)}`}
                    >
                      {r.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {renewals.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[15px] font-[590] tracking-[-0.012em] text-paper">
            This month ·{" "}
            <span className="font-mono text-sm font-normal text-fog">
              {renewals.length} renewal{renewals.length === 1 ? "" : "s"}
            </span>
          </h2>
          <Card className="divide-y divide-graphite p-0">
            {renewals.map((r) => (
              <div
                key={`${r.name}-${r.date.toISOString()}`}
                className="flex items-center justify-between px-6 py-3"
              >
                <div className="flex items-center gap-3">
                  <Badge>{format(r.date, "MMM d")}</Badge>
                  <span className="text-sm text-mist">{r.name}</span>
                </div>
                <span className="font-mono text-sm text-fog">
                  {formatMoney(r.price, r.currency)}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function clampInt(value: string | undefined, fallback: number, min: number, max: number) {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function nextAlignedRenewal(
  date: Date,
  cycle: string,
  limit: Date
): Date {
  const MS_PER_DAY = 86_400_000;
  let cursor = new Date(date);
  let guard = 0;
  while (cursor.getTime() + 366 * MS_PER_DAY < limit.getTime() && guard < 600) {
    cursor = stepCycle(cursor, cycle);
    guard += 1;
  }
  return cursor;
}

function stepCycle(date: Date, cycle: string): Date {
  switch (cycle) {
    case "weekly":
      return new Date(date.getTime() + 7 * 86_400_000);
    case "quarterly":
      return new Date(date.setFullYear(date.getFullYear(), date.getMonth() + 3, date.getDate()));
    case "yearly":
      return new Date(date.setFullYear(date.getFullYear() + 1));
    default:
      return new Date(date.setFullYear(date.getFullYear(), date.getMonth() + 1, date.getDate()));
  }
}
