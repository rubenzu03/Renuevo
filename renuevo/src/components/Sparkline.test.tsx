import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Sparkline from "./Sparkline";

const history = (prices: string[]) =>
  prices.map((p) => ({ price: { toString: () => p } }));

describe("Sparkline", () => {
  it("renders nothing with fewer than two prices", () => {
    const { container } = render(
      <Sparkline history={history(["10"])} currency="EUR" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a polyline and the latest price as the label", () => {
    const { container } = render(
      <Sparkline history={history(["10", "12"])} currency="EUR" />
    );
    const polyline = container.querySelector("polyline");
    expect(polyline).toBeInTheDocument();
    expect(polyline).toHaveAttribute("points");
    expect(container.querySelector("text")).toHaveTextContent("€12.00");
  });
});