import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { signSession } from "./lib/auth";
import { config, proxy } from "./proxy";

function makeRequest(url: string, token?: string): NextRequest {
  const req = new NextRequest(url);
  if (token) req.cookies.set("renuevo_session", token);
  return req;
}

describe("proxy", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "proxy-test-secret";
  });

  it("redirects unauthenticated users to /login with a next param", async () => {
    const res = await proxy(makeRequest("http://localhost:3000/subscriptions"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/subscriptions");
  });

  it("preserves the query string in next", async () => {
    const res = await proxy(makeRequest("http://localhost:3000/subscriptions?page=2"));
    const location = new URL(res.headers.get("location")!);
    expect(location.searchParams.get("next")).toBe("/subscriptions?page=2");
  });

  it("lets authenticated users through", async () => {
    const token = signSession();
    const res = await proxy(makeRequest("http://localhost:3000/", token));
    expect(res.status).toBe(200);
  });

  it("lets unauthenticated users view /login", async () => {
    const res = await proxy(makeRequest("http://localhost:3000/login"));
    expect(res.status).toBe(200);
  });

  it("redirects authenticated users away from /login", async () => {
    const token = signSession();
    const res = await proxy(makeRequest("http://localhost:3000/login", token));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });

  it("excludes API routes and static assets from the guard", () => {
    expect(config.matcher.length).toBeGreaterThan(0);
    const regex = new RegExp(`^${config.matcher[0]}$`);
    expect(regex.test("/api/cron/check-subscriptions")).toBe(false);
    expect(regex.test("/_next/static/chunks/foo.js")).toBe(false);
    expect(regex.test("/logo.png")).toBe(false);
    expect(regex.test("/subscriptions")).toBe(true);
  });
});