import { createHmac } from "crypto";
import { afterEach, describe, expect, it } from "vitest";
import { isMobileAuthorized, signMobileToken, verifyMobileToken } from "./mobile-auth";

describe("mobile-auth", () => {
  afterEach(() => {
    process.env.AUTH_SECRET = "test-auth-secret-0123456789abcdef";
  });

  it("signs a token that verifies", () => {
    const token = signMobileToken();
    expect(token).toContain(".");
    expect(verifyMobileToken(token)).toBe(true);
  });

  it("rejects a tampered token", () => {
    const token = signMobileToken();
    const [payload] = token.split(".");
    expect(verifyMobileToken(`${payload}.tampered`)).toBe(false);
  });

  it("rejects an expired token", () => {
    process.env.AUTH_SECRET = "test-auth-secret-0123456789abcdef";
    const payload = `renuevo:mobile:v1:${Date.now() - 1000}`;
    const sig = createHmac("sha256", process.env.AUTH_SECRET!)
      .update(payload)
      .digest("base64url");
    expect(verifyMobileToken(`${payload}.${sig}`)).toBe(false);
  });

  it("rejects when AUTH_SECRET is unset", () => {
    delete process.env.AUTH_SECRET;
    expect(signMobileToken).toThrow("AUTH_SECRET is not set");
    expect(verifyMobileToken("payload.sig")).toBe(false);
    expect(isMobileAuthorized("Bearer something")).toBe(false);
  });

  it("rejects missing or malformed authorization headers", () => {
    const token = signMobileToken();
    expect(isMobileAuthorized(null)).toBe(false);
    expect(isMobileAuthorized("Token abc")).toBe(false);
    expect(isMobileAuthorized(`Bearer ${token}`)).toBe(true);
  });

  it("rejects an invalid token shape", () => {
    expect(verifyMobileToken("no-separator")).toBe(false);
    expect(verifyMobileToken(undefined)).toBe(false);
  });
});