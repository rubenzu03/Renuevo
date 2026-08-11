import { beforeEach, describe, expect, it, vi } from "vitest";

const { loginMock, logoutMock, redirectMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  login: loginMock,
  logout: logoutMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { loginAction, logoutAction } from "./auth";

function form(next: string): FormData {
  const fd = new FormData();
  fd.set("password", "whatever");
  fd.set("next", next);
  return fd;
}

describe("loginAction", () => {
  beforeEach(() => {
    process.env.APP_PASSWORD = "test-app-password";
    loginMock.mockReset();
    redirectMock.mockReset();
  });

  it("reports when auth is not configured", async () => {
    delete process.env.APP_PASSWORD;
    const res = await loginAction(null, form("/"));
    expect(res).toEqual({ error: "Auth is not configured" });
  });

  it("reports a wrong password", async () => {
    loginMock.mockResolvedValue(false);
    const res = await loginAction(null, form("/"));
    expect(res).toEqual({ error: "Wrong password" });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to the requested next path on success", async () => {
    loginMock.mockResolvedValue(true);
    const res = await loginAction(null, form("/subscriptions"));
    expect(res).toBeUndefined();
    expect(redirectMock).toHaveBeenCalledWith("/subscriptions");
  });

  it("defaults to / when next is missing", async () => {
    loginMock.mockResolvedValue(true);
    await loginAction(null, new FormData());
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("rejects absolute URLs", async () => {
    loginMock.mockResolvedValue(true);
    await loginAction(null, form("https://evil.example.com"));
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("rejects protocol-relative URLs", async () => {
    loginMock.mockResolvedValue(true);
    await loginAction(null, form("//evil.example.com"));
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});

describe("logoutAction", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    redirectMock.mockReset();
  });

  it("clears the session and returns to /login", async () => {
    await logoutAction();
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});