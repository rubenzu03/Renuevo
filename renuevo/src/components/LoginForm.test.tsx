import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loginActionMock } = vi.hoisted(() => ({ loginActionMock: vi.fn() }));

vi.mock("@/actions/auth", () => ({ loginAction: loginActionMock }));

import LoginForm from "./LoginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    loginActionMock.mockReset();
  });

  it("embeds the next path as a hidden field", () => {
    render(<LoginForm next="/subscriptions" />);
    expect(screen.getByText("Password")).toBeInTheDocument();
    const hidden = document.querySelector('input[name="next"]');
    expect(hidden).toHaveValue("/subscriptions");
  });

  it("shows the login error from the action", async () => {
    loginActionMock.mockResolvedValue({ error: "Wrong password" });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Password"), "nope");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(screen.getByText("Wrong password")).toBeInTheDocument()
    );

    const formData = loginActionMock.mock.calls[0][1] as FormData;
    expect(formData.get("password")).toBe("nope");
    expect(formData.get("next")).toBe("/");
  });

  it("submits cleanly when the action succeeds", async () => {
    loginActionMock.mockResolvedValue(null);
    const user = userEvent.setup();

    render(<LoginForm next="/subscriptions" />);

    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(loginActionMock).toHaveBeenCalledTimes(1));
  });
});