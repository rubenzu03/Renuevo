import { NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { signMobileToken } from "@/lib/mobile-auth";
import { badRequest, ok, OPTIONS, unauthorized } from "@/lib/mobile/http";

export const dynamic = "force-dynamic";

export { OPTIONS };

export async function POST(req: NextRequest) {
  if (!process.env.APP_PASSWORD) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String((body as { password: unknown }).password)
      : "";

  if (!verifyPassword(password)) {
    return unauthorized();
  }

  return ok({ token: signMobileToken() });
}