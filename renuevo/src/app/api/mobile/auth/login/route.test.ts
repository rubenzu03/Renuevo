import { beforeEach, describe, expect, it, vi } from "vitest";

const { signMobileToken, verifyMobileToken } = vi.hoisted(() => ({
  signMobileToken: vi.fn(),
  verifyMobileToken: vi.fn(),
}));

vi.mock("@/lib/mobile-auth", () => ({ signMobileToken, verifyMobileToken }));

vi.mock("@/lib/auth", () => ({ verifyPassword: vi.fn() }));
vi.mock("@/lib/mobile/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mobile/http")>();
  return { ...actual };
});

import { NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { POST } from "./route";

function loginRequest(password?: string): NextRequest {
  const req = new NextRequest("http://localhost:3000/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  return req;
}

describe("POST /api/mobile/auth/login", () => {
  beforeEach(() => {
    process.env.APP_PASSWORD = "test-app-password";
    signMobileToken.mockReturnValue("signed-token");
    vi.mocked(verifyPassword).mockReturnValue(true);
  });

  it("returns a token for a correct password", async () => {
    const res = await POST(loginRequest("test-app-password"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: "signed-token" });
  });

  it("rejects a wrong password", async () => {
    vi.mocked(verifyPassword).mockReturnValue(false);
    const res = await POST(loginRequest("wrong"));
    expect(res.status).toBe(401);
  });

  it("rejects when APP_PASSWORD is unset", async () => {
    delete process.env.APP_PASSWORD;
    const res = await POST(loginRequest("test-app-password"));
    expect(res.status).toBe(401);
  });

  it("rejects malformed JSON", async () => {
    const req = new NextRequest("http://localhost:3000/api/mobile/auth/login", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("adds CORS headers", async () => {
    const res = await POST(loginRequest("test-app-password"));
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});