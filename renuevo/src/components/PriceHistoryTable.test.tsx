import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PriceHistoryTable from "./PriceHistoryTable";

const history = (prices: string[]) =>
  prices.map((p, i) => ({
    id: `h${i}`,
    price: { toString: () => p },
    recordedAt: new Date(2026, 0, i + 1),
  }));

describe("PriceHistoryTable", () => {
  it("marks the oldest price with an em dash", () => {
    render(<PriceHistoryTable history={history(["10", "12"])} currency="EUR" />);
    expect(screen.getAllByText("—").length).toBe(1);
  });

  it("shows increases as a positive amount on the latest row", () => {
    render(<PriceHistoryTable history={history(["10", "12"])} currency="EUR" />);
    expect(screen.getByText("+€2.00")).toBeInTheDocument();
  });

  it("shows decreases as a negative amount", () => {
    render(<PriceHistoryTable history={history(["10", "8"])} currency="EUR" />);
    expect(screen.getByText("-€2.00")).toBeInTheDocument();
  });

  it("labels unchanged prices", () => {
    render(<PriceHistoryTable history={history(["10", "10"])} currency="EUR" />);
    expect(screen.getByText("no change")).toBeInTheDocument();
  });

  it("renders the latest price first", () => {
    const { container } = render(
      <PriceHistoryTable history={history(["10", "12"])} currency="EUR" />
    );
    const firstRow = container.querySelector("tbody tr")!;
    expect(firstRow.textContent).toContain("+€2.00");
  });
});