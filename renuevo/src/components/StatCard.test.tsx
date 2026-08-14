import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatCard from "./StatCard";

describe("StatCard", () => {
  it("renders title, value and sub", () => {
    render(
      <StatCard
        title="Monthly total"
        value="€10.00"
        sub="Active subscriptions"
      />
    );
    expect(screen.getByText("Monthly total")).toBeInTheDocument();
    expect(screen.getByText("€10.00")).toBeInTheDocument();
    expect(screen.getByText("Active subscriptions")).toBeInTheDocument();
  });

  it("omits the sub when absent", () => {
    render(<StatCard title="Monthly total" value="€10.00" />);
    expect(screen.getByText("Monthly total")).toBeInTheDocument();
    expect(screen.getByText("€10.00")).toBeInTheDocument();
    expect(screen.queryByText("Active subscriptions")).not.toBeInTheDocument();
  });
});