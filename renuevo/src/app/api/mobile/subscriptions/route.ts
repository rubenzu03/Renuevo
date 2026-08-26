import { NextRequest } from "next/server";
import { isMobileAuthorized } from "@/lib/mobile-auth";
import { badRequest, created, ok, OPTIONS, unauthorized } from "@/lib/mobile/http";
import { serializeSubscription } from "@/lib/mobile/serialization";
import { subscriptionSchema } from "@/lib/subscription-validation";
import {
  createSubscription,
  listSubscriptions,
} from "@/lib/subscriptions-service";

export const dynamic = "force-dynamic";

export { OPTIONS };

export async function GET(req: NextRequest) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const subscriptions = await listSubscriptions();
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

  const subscription = await createSubscription(parsed.data);
  return created(serializeSubscription(subscription));
}