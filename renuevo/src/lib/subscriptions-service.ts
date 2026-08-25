import { prisma } from "@/lib/prisma";
import { toDbInput, type SubscriptionInput } from "@/lib/subscription-validation";

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