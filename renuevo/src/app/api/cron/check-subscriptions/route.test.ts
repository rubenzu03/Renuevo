import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { runChecksMock } = vi.hoisted(() => ({ runChecksMock: vi.fn() }));

vi.mock("@/lib/notifications", () => ({ runChecks: runChecksMock }));

import { GET } from "./route";

const RESULT = {
  advanced: 0,
  renewalsNotified: 1,
  priceChangesNotified: 2,
};

function cronRequest(secret?: string): NextRequest {
  const req = new NextRequest(
    "http://localhost:3000/api/cron/check-subscriptions"
  );
  if (secret) req.headers.set("x-cron-secret", secret);
  return req;
}

describe("GET /api/cron/check-subscriptions", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    runChecksMock.mockReset();
    runChecksMock.mockResolvedValue(RESULT);
  });

  it("rejects requests without a secret", async () => {
    const res = await GET(cronRequest());
    expect(res.status).toBe(401);
    expect(runChecksMock).not.toHaveBeenCalled();
  });

  it("rejects requests with a wrong secret", async () => {
    const res = await GET(cronRequest("nope"));
    expect(res.status).toBe(401);
    expect(runChecksMock).not.toHaveBeenCalled();
  });

  it("rejects requests when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(cronRequest("test-cron-secret"));
    expect(res.status).toBe(401);
  });

  it("runs checks and returns the result with the correct secret", async () => {
    const res = await GET(cronRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(RESULT);
    expect(runChecksMock).toHaveBeenCalledTimes(1);
  });
});