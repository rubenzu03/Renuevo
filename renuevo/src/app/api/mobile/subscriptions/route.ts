import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMobileAuthorized } from "@/lib/mobile-auth";
import { created, ok, OPTIONS, unauthorized } from "@/lib/mobile/http";
import { serializeSubscription } from "@/lib/mobile/serialization";
import {
  subscriptionSchema,
  toDbInput,
} from "@/lib/subscription-validation";
import { badRequest } from "@/lib/mobile/http";

export const dynamic = "force-dynamic";

export { OPTIONS };

export async function GET(req: NextRequest) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });
  return ok(subscriptions.map(serializeSubscription));
}

export async function POST(req: NextRequest) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = subscriptionSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Check the form");
  }

  const subscription = await prisma.subscription.create({
    data: { ...toDbInput(parsed.data), isActive: true },
  });
  return created(serializeSubscription(subscription));
}