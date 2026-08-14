import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteSubscriptionMock } = vi.hoisted(() => ({
  deleteSubscriptionMock: vi.fn(),
}));

vi.mock("@/actions/subscriptions", () => ({
  deleteSubscription: deleteSubscriptionMock,
}));

import DeleteButton from "./DeleteButton";

describe("DeleteButton", () => {
  beforeEach(() => {
    deleteSubscriptionMock.mockReset();
    deleteSubscriptionMock.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("deletes when the user confirms", async () => {
    const user = userEvent.setup();
    render(<DeleteButton id="sub1" />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(deleteSubscriptionMock).toHaveBeenCalledTimes(1)
    );
    expect(window.confirm).toHaveBeenCalledWith("Delete this subscription?");
  });

  it("does not delete when the user cancels", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<DeleteButton id="sub1" />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteSubscriptionMock).not.toHaveBeenCalled();
  });
});