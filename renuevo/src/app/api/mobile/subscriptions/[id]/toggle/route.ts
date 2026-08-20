import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMobileAuthorized } from "@/lib/mobile-auth";
import { notFound, ok, OPTIONS, unauthorized } from "@/lib/mobile/http";
import { serializeSubscription } from "@/lib/mobile/serialization";

export const dynamic = "force-dynamic";

export { OPTIONS };

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const { id } = await ctx.params;

  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return notFound();

  const updated = await prisma.subscription.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  return ok(serializeSubscription(updated));
}