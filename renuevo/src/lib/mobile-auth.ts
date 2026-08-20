import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_MARKER = "renuevo:mobile:v1";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function constantTimeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function signMobileToken(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const payload = `${TOKEN_MARKER}:${Date.now() + TOKEN_MAX_AGE * 1000}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyMobileToken(token: string | undefined): boolean {
  if (!token || !process.env.AUTH_SECRET) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", process.env.AUTH_SECRET)
    .update(payload)
    .digest("base64url");
  if (!constantTimeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const expiresAt = payload.split(":").pop();
  return Number(expiresAt) > Date.now();
}

/** Extract and validate a `Bearer <token>` from the Authorization header. */
export function isMobileAuthorized(authorization: string | null): boolean {
  if (!authorization?.startsWith("Bearer ")) return false;
  return verifyMobileToken(authorization.slice("Bearer ".length));
}