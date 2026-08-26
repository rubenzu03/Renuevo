import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { isAuthenticatedMock, redirectMock } = vi.hoisted(() => ({
  isAuthenticatedMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ isAuthenticated: isAuthenticatedMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import IntroductionPage from "./page";

describe("IntroductionPage", () => {
  it("redirects authenticated users to /overview", async () => {
    isAuthenticatedMock.mockResolvedValue(true);
    render(await IntroductionPage({ searchParams: Promise.resolve({}) }));
    expect(redirectMock).toHaveBeenCalledWith("/overview");
  });

  it("renders the landing content for guests", async () => {
    isAuthenticatedMock.mockResolvedValue(false);
    render(
      await IntroductionPage({
        searchParams: Promise.resolve({ next: "/subscriptions" }),
      })
    );

    expect(
      screen.getByRole("heading", {
        name: /Know exactly where your money recurs/,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Built for quiet vigilance")).toBeInTheDocument();
    expect(screen.getAllByText("How it works").length).toBeGreaterThan(0);

    const getStarted = screen.getAllByRole("link", { name: "Get started" });
    expect(getStarted.length).toBeGreaterThan(0);
    for (const link of getStarted) {
      expect(link).toHaveAttribute("href", "#signin");
    }
    expect(screen.getAllByText(/Never miss a renewal/).length).toBeGreaterThan(0);

    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    const hidden = document.querySelector('input[name="next"]');
    expect(hidden).toHaveValue("/subscriptions");

    const featureAnchors = screen.getAllByText("Features");
    expect(featureAnchors.length).toBeGreaterThan(0);
  });
});
