import { NextRequest } from "next/server";
import { isMobileAuthorized } from "@/lib/mobile-auth";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  OPTIONS,
  unauthorized,
} from "@/lib/mobile/http";
import { serializeSubscription } from "@/lib/mobile/serialization";
import { subscriptionSchema } from "@/lib/subscription-validation";
import {
  deleteSubscription,
  getSubscriptionWithPriceHistory,
  updateSubscription,
} from "@/lib/subscriptions-service";

export const dynamic = "force-dynamic";

export { OPTIONS };

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const { id } = await ctx.params;
  const subscription = await getSubscriptionWithPriceHistory(id);
  if (!subscription) return notFound();
  return ok(serializeSubscription(subscription));
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const { id } = await ctx.params;

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

  const updated = await updateSubscription(id, parsed.data);
  if (!updated) return notFound();

  return ok(serializeSubscription(updated));
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const { id } = await ctx.params;
  const deleted = await deleteSubscription(id);
  if (!deleted) return notFound();

  return noContent();
}