export function monthlyAmount(price: number, cycle: string): number {
  switch (cycle) {
    case "weekly":
      return (price * 52) / 12;
    case "quarterly":
      return price / 3;
    case "yearly":
      return price / 12;
    default:
      return price;
  }
}