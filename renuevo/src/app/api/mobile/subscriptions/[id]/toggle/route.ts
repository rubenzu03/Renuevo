import { NextRequest } from "next/server";
import { isMobileAuthorized } from "@/lib/mobile-auth";
import { notFound, ok, OPTIONS, unauthorized } from "@/lib/mobile/http";
import { serializeSubscription } from "@/lib/mobile/serialization";
import { toggleSubscriptionActive } from "@/lib/subscriptions-service";

export const dynamic = "force-dynamic";

export { OPTIONS };

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const { id } = await ctx.params;

  const updated = await toggleSubscriptionActive(id);
  if (!updated) return notFound();

  return ok(serializeSubscription(updated));
}