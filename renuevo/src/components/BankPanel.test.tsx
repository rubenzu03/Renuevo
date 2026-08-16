import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { connectMockBankMock, refreshBankMock } = vi.hoisted(() => ({
  connectMockBankMock: vi.fn(),
  refreshBankMock: vi.fn(),
}));

vi.mock("@/actions/bank", () => ({
  connectMockBank: connectMockBankMock,
  refreshBank: refreshBankMock,
}));

import BankPanel, { type BankConnectionView } from "./BankPanel";

const connected: BankConnectionView = {
  id: "c1",
  institutionName: "Demo Bank",
  transactionCount: 42,
  syncedAt: "2026-08-10T12:00:00.000Z",
};

describe("BankPanel", () => {
  it("shows a connect CTA when there is no connection", () => {
    render(<BankPanel connection={null} />);
    expect(screen.getByText("Connect a bank account")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect demo bank" })
    ).toBeInTheDocument();
  });

  it("connects a demo bank on submit", async () => {
    connectMockBankMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<BankPanel connection={null} />);

    await user.click(screen.getByRole("button", { name: "Connect demo bank" }));
    expect(connectMockBankMock).toHaveBeenCalledTimes(1);
  });

  it("shows connection details when connected", () => {
    render(<BankPanel connection={connected} />);
    expect(screen.getByText("Demo Bank")).toBeInTheDocument();
    expect(screen.getByText(/42 transactions/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync now" })).toBeInTheDocument();
  });

  it("syncs the connection on submit", async () => {
    refreshBankMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<BankPanel connection={connected} />);

    await user.click(screen.getByRole("button", { name: "Sync now" }));
    expect(refreshBankMock).toHaveBeenCalledTimes(1);
    expect(refreshBankMock).toHaveBeenCalledWith("c1", expect.anything());
  });
});