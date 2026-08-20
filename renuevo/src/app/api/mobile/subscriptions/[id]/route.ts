import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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
import {
  subscriptionSchema,
  toDbInput,
} from "@/lib/subscription-validation";

export const dynamic = "force-dynamic";

export { OPTIONS };

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const { id } = await ctx.params;
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { priceHistories: { orderBy: { recordedAt: "asc" } } },
  });
  if (!subscription) return notFound();
  return ok(serializeSubscription(subscription));
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const { id } = await ctx.params;

  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return notFound();

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

  const priceChanged = !existing.priceCurrent.equals(parsed.data.price);

  const updated = await prisma.$transaction(async (tx) => {
    if (priceChanged) {
      await tx.priceHistory.create({
        data: { subscriptionId: id, price: existing.priceCurrent },
      });
    }
    return tx.subscription.update({
      where: { id },
      data: toDbInput(parsed.data),
    });
  });

  return ok(serializeSubscription(updated));
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!isMobileAuthorized(req.headers.get("authorization"))) {
    return unauthorized();
  }
  const { id } = await ctx.params;
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return notFound();

  await prisma.subscription.delete({ where: { id } });
  return noContent();
}