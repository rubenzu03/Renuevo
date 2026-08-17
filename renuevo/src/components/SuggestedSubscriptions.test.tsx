import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { acceptSuggestionMock, dismissSuggestionMock } = vi.hoisted(() => ({
  acceptSuggestionMock: vi.fn(),
  dismissSuggestionMock: vi.fn(),
}));

vi.mock("@/actions/bank", () => ({
  acceptSuggestion: acceptSuggestionMock,
  dismissSuggestion: dismissSuggestionMock,
}));

import SuggestedSubscriptions, {
  type SuggestedSubscriptionView,
} from "./SuggestedSubscriptions";

const pending: SuggestedSubscriptionView = {
  id: "s1",
  merchantName: "Netflix",
  amount: "15.49",
  currency: "EUR",
  billingCycle: "monthly",
  occurrences: 8,
  firstSeen: "2025-12-03T00:00:00.000Z",
  nextDueDate: "2026-09-03T00:00:00.000Z",
  priceChanged: true,
  status: "pending",
};

const reviewed: SuggestedSubscriptionView = {
  ...pending,
  id: "s2",
  merchantName: "Spotify",
  amount: "9.99",
  priceChanged: false,
  nextDueDate: "2026-09-08T00:00:00.000Z",
  status: "accepted",
};

describe("SuggestedSubscriptions", () => {
  it("shows an empty state when there are no suggestions", () => {
    render(<SuggestedSubscriptions suggestions={[]} />);
    expect(
      screen.getByText(/No recurring charges detected yet/)
    ).toBeInTheDocument();
  });

  it("renders pending suggestions with price and cadence info", () => {
    render(<SuggestedSubscriptions suggestions={[pending]} />);
    expect(window.document.body.textContent).toContain("Netflix");
    expect(window.document.body.textContent).toContain("€15.49");
    expect(window.document.body.textContent).toContain("8 charges");
  });

  it("marks price-changed suggestions", () => {
    render(<SuggestedSubscriptions suggestions={[pending]} />);
    expect(screen.getByText("Price changed")).toBeInTheDocument();
  });

  it("calls acceptSuggestion with the suggestion id", async () => {
    acceptSuggestionMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SuggestedSubscriptions suggestions={[pending]} />);

    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(acceptSuggestionMock).toHaveBeenCalledTimes(1);
    expect(acceptSuggestionMock).toHaveBeenCalledWith("s1", expect.anything());
  });

  it("calls dismissSuggestion with the suggestion id", async () => {
    dismissSuggestionMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SuggestedSubscriptions suggestions={[pending]} />);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(dismissSuggestionMock).toHaveBeenCalledTimes(1);
    expect(dismissSuggestionMock).toHaveBeenCalledWith("s1", expect.anything());
  });

  it("shows reviewed suggestions without accept/dismiss buttons", () => {
    render(<SuggestedSubscriptions suggestions={[pending, reviewed]} />);
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    expect(screen.getByText("accepted")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Accept" })).toHaveLength(1);
  });
});