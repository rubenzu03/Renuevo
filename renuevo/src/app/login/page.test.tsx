import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { isAuthenticatedMock, redirectMock } = vi.hoisted(() => ({
  isAuthenticatedMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ isAuthenticated: isAuthenticatedMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import LoginPage from "./page";

describe("LoginPage", () => {
  it("redirects authenticated users to the dashboard", async () => {
    isAuthenticatedMock.mockResolvedValue(true);
    render(await LoginPage({ searchParams: Promise.resolve({}) }));
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("renders the login form for guests", async () => {
    isAuthenticatedMock.mockResolvedValue(false);
    render(await LoginPage({ searchParams: Promise.resolve({ next: "/subs" }) }));
    expect(screen.getByText("Sign in to manage your subscriptions.")).toBeInTheDocument();
    const hidden = document.querySelector('input[name="next"]');
    expect(hidden).toHaveValue("/subs");
  });
});