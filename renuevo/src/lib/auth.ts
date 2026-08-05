import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "renuevo_session";

const SESSION_MARKER = "renuevo:auth:v1";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function constantTimeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function signSession(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(SESSION_MARKER).digest("base64url");
}

export function verifySession(token: string | undefined): boolean {
  if (!token || !process.env.AUTH_SECRET) return false;
  const actual = Buffer.from(token, "base64url");
  const expected = Buffer.from(signSession(), "base64url");
  return constantTimeEqual(actual, expected);
}

export function verifyPassword(input: string): boolean {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD is not set");
  const actual = Buffer.from(input);
  const expected = Buffer.from(password);
  return constantTimeEqual(actual, expected);
}

export async function isAuthenticated(): Promise<boolean> {
  const value = (await cookies()).get(AUTH_COOKIE)?.value;
  return verifySession(value);
}

export async function login(password: string): Promise<boolean> {
  if (!verifyPassword(password)) return false;
  (await cookies()).set(AUTH_COOKIE, signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return true;
}

export async function logout(): Promise<void> {
  (await cookies()).delete(AUTH_COOKIE);
}
