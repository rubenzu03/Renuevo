import { prisma } from "@/lib/prisma";
import { toDbInput, type SubscriptionInput } from "@/lib/subscription-validation";

/**
 * Shared subscription business logic.
 *
 * Both the web server actions and the mobile API routes call these functions so
 * that the rules that matter — creating a subscription with a default state,
 * archiving the previous price before an update, toggling activity, etc. — live
 * in exactly one place.
 *
 * All functions operate on already-validated input (`SubscriptionInput`) and
 * return the resulting Prisma record, or `null` when the subscription does not
 * exist. Callers are responsible for authentication, redirects and HTTP
 * serialization.
 */

export async function listSubscriptions() {
  return prisma.subscription.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getSubscription(id: string) {
  return prisma.subscription.findUnique({ where: { id } });
}

export async function getSubscriptionWithPriceHistory(id: string) {
  return prisma.subscription.findUnique({
    where: { id },
    include: { priceHistories: { orderBy: { recordedAt: "asc" } } },
  });
}

export async function createSubscription(input: SubscriptionInput) {
  return prisma.subscription.create({
    data: { ...toDbInput(input), isActive: true },
  });
}

/**
 * Update a subscription, archiving the current price to `PriceHistory` when the
 * price changes so a full timeline is preserved.
 */
export async function updateSubscription(id: string, input: SubscriptionInput) {
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return null;

  const priceChanged = !existing.priceCurrent.equals(input.price);

  return prisma.$transaction(async (tx) => {
    if (priceChanged) {
      await tx.priceHistory.create({
        data: { subscriptionId: id, price: existing.priceCurrent },
      });
    }
    return tx.subscription.update({
      where: { id },
      data: toDbInput(input),
    });
  });
}

export async function deleteSubscription(id: string) {
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return false;

  await prisma.subscription.delete({ where: { id } });
  return true;
}

export async function toggleSubscriptionActive(id: string) {
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) return null;

  return prisma.subscription.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
}