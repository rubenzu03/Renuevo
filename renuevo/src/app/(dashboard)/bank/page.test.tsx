import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { findFirstMock, findManyMock, countMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bankConnection: { findFirst: findFirstMock },
    suggestedSubscription: { findMany: findManyMock },
    bankTransaction: { count: countMock },
  },
}));

vi.mock("@/components/BankPanel", () => ({
  default: ({ connection }: { connection: unknown }) => (
    <div>{connection ? "connected-panel" : "empty-panel"}</div>
  ),
}));

import BankPage from "./page";

describe("BankPage", () => {
  it("shows an empty panel when no connection exists", async () => {
    findFirstMock.mockResolvedValue(null);
    findManyMock.mockResolvedValue([]);

    render(await BankPage());

    expect(screen.getByText("Bank")).toBeInTheDocument();
    expect(screen.getByText("empty-panel")).toBeInTheDocument();
    expect(screen.getByText(/No recurring charges detected yet/)).toBeInTheDocument();
  });

  it("shows connection details and suggestions when connected", async () => {
    findFirstMock.mockResolvedValue({
      id: "c1",
      institutionName: "Demo Bank",
      syncedAt: new Date("2026-08-10T12:00:00.000Z"),
    });
    countMock.mockResolvedValue(42);
    findManyMock.mockResolvedValue([
      {
        id: "s1",
        merchantName: "Netflix",
        amount: { toString: () => "15.49" },
        currency: "EUR",
        billingCycle: "monthly",
        occurrences: 8,
        firstSeen: new Date("2025-12-03T00:00:00.000Z"),
        nextDueDate: new Date("2026-09-03T00:00:00.000Z"),
        priceChanged: true,
        status: "pending",
      },
    ]);

    render(await BankPage());

    expect(screen.getByText("connected-panel")).toBeInTheDocument();
    expect(window.document.body.textContent).toContain("Netflix");
  });
});