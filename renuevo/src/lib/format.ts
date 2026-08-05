export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(
      value
    );
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function daysUntilText(days: number): string {
  if (days < 0) return "past due";
  if (days === 0) return "today";
  return `in ${days} day${days === 1 ? "" : "s"}`;
}
