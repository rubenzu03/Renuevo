import { beforeEach, describe, expect, it } from "vitest";
import { signSession, verifyPassword, verifySession } from "./auth";

describe("session token", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "unit-test-secret";
  });

  it("verifies its own token", () => {
    const token = signSession();
    expect(verifySession(token)).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(verifySession(undefined)).toBe(false);
  });

  it("rejects a token with a different length", () => {
    expect(verifySession("too-short")).toBe(false);
  });

  it("rejects a same-length but different token", () => {
    const token = signSession();
    const bytes = Buffer.from(token, "base64url");
    bytes[0] ^= 0xff;
    const tampered = bytes.toString("base64url");
    expect(verifySession(tampered)).toBe(false);
  });

  it("throws when AUTH_SECRET is missing", () => {
    delete process.env.AUTH_SECRET;
    expect(() => signSession()).toThrow("AUTH_SECRET is not set");
  });
});

describe("verifyPassword", () => {
  beforeEach(() => {
    process.env.APP_PASSWORD = "hunter2";
  });

  it("accepts the correct password", () => {
    expect(verifyPassword("hunter2")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyPassword("hunter3")).toBe(false);
  });

  it("throws when APP_PASSWORD is missing", () => {
    delete process.env.APP_PASSWORD;
    expect(() => verifyPassword("x")).toThrow("APP_PASSWORD is not set");
  });
});