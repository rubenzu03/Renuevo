import { render, screen } from "@testing-library/react";
import { addDays, format } from "date-fns";
import { describe, expect, it, vi } from "vitest";

const { findManyMock } = vi.hoisted(() => ({ findManyMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { subscription: { findMany: findManyMock } },
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("shows totals, next renewal and the upcoming list", async () => {
    const today = new Date();
    const weekly = {
      id: "s1",
      name: "Netflix",
      priceCurrent: { toString: () => "3" },
      currency: "EUR",
      billingCycle: "weekly",
      nextRenewalDate: addDays(today, 2),
      category: "streaming",
    };
    const monthly = {
      id: "s2",
      name: "Spotify",
      priceCurrent: { toString: () => "12" },
      currency: "EUR",
      billingCycle: "monthly",
      nextRenewalDate: addDays(today, 1),
      category: "music",
    };
    findManyMock.mockResolvedValue([monthly, weekly]);

    render(await DashboardPage());

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("€25.00")).toBeInTheDocument();
    expect(screen.getByText("€300.00")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByText(format(monthly.nextRenewalDate, "MMM d"))
    ).toBeInTheDocument();
    expect(screen.getByText("in 1 day")).toBeInTheDocument();
    expect(screen.getByText("Spotify")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
  });

  it("shows empty states with no subscriptions", async () => {
    findManyMock.mockResolvedValue([]);

    render(await DashboardPage());

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("No active subscriptions")).toBeInTheDocument();
    expect(screen.getByText(/No subscriptions yet/)).toBeInTheDocument();
  });
});