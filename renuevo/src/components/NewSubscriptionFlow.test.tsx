import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSubscriptionMock } = vi.hoisted(() => ({
  createSubscriptionMock: vi.fn(),
}));

vi.mock("@/actions/subscriptions", () => ({
  createSubscription: createSubscriptionMock,
}));

import NewSubscriptionFlow from "./NewSubscriptionFlow";

describe("NewSubscriptionFlow", () => {
  beforeEach(() => {
    createSubscriptionMock.mockReset();
    createSubscriptionMock.mockResolvedValue({ status: "ok" });
  });

  it("lists the presets and a custom option", () => {
    render(<NewSubscriptionFlow />);
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("Spotify")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("pre-fills the form when a preset is picked", async () => {
    const user = userEvent.setup();
    render(<NewSubscriptionFlow />);

    await user.click(screen.getByText("Netflix"));

    expect(screen.getByLabelText("Name")).toHaveValue("Netflix");
    expect(screen.getByLabelText("Category (optional)")).toHaveValue(
      "streaming"
    );
  });

  it("starts from scratch with custom", async () => {
    const user = userEvent.setup();
    render(<NewSubscriptionFlow />);

    await user.click(screen.getByText("Custom"));

    expect(screen.getByLabelText("Name")).toHaveValue("");
  });

  it("can return to the template picker", async () => {
    const user = userEvent.setup();
    render(<NewSubscriptionFlow />);

    await user.click(screen.getByText("Netflix"));
    await user.click(screen.getByRole("button", { name: /Choose another template/ }));

    expect(screen.getByText("Custom")).toBeInTheDocument();
  });
});