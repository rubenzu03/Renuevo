import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SubscriptionForm, {
  type SubscriptionFormValues,
} from "./SubscriptionForm";

const action = vi.fn();

const initial: SubscriptionFormValues = {
  name: "Netflix",
  price: "9.99",
  currency: "EUR",
  billingCycle: "monthly",
  nextRenewalDate: "2026-09-01",
  category: null,
};

describe("SubscriptionForm", () => {
  it("pre-fills fields from initial values", () => {
    render(
      <SubscriptionForm
        action={action}
        initial={initial}
        submitLabel="Save changes"
      />
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Netflix");
    expect(screen.getByLabelText("Price")).toHaveValue("9.99");
    expect(screen.getByLabelText("Currency")).toHaveValue("EUR");
    expect(screen.getByLabelText("Next renewal")).toHaveValue("2026-09-01");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("submits the form data to the action", async () => {
    action.mockResolvedValue({ status: "ok" });
    const user = userEvent.setup();

    render(<SubscriptionForm action={action} initial={initial} />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Netflix");
    expect(formData.get("price")).toBe("9.99");
  });

  it("renders the server error message", async () => {
    action.mockResolvedValue({
      status: "error",
      message: "Check the form",
      fieldErrors: { name: ["Too short"] },
    });
    const user = userEvent.setup();

    render(<SubscriptionForm action={action} initial={initial} />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByText("Check the form")).toBeInTheDocument()
    );
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("defaults to empty values without initial data", () => {
    render(<SubscriptionForm action={action} submitLabel="Add subscription" />);
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Price")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add subscription" })).toBeInTheDocument();
  });
});