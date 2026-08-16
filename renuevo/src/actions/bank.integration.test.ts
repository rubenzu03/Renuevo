import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDb } from "../../tests/db";

const { requireAuthMock, redirectMock, revalidatePathMock } = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  redirectMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireAuth: requireAuthMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { prisma } from "@/lib/prisma";
import {
  acceptSuggestion,
  connectMockBank,
  dismissSuggestion,
  refreshBank,
} from "./bank";

describe("bank actions (integration)", () => {
  beforeEach(async () => {
    await resetDb();
    requireAuthMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("connectMockBank creates a mock connection and syncs", async () => {
    await connectMockBank();

    const connection = await prisma.bankConnection.findFirstOrThrow();
    expect(connection.provider).toBe("mock");
    expect(connection.institutionName).toBe("Demo Bank");
    expect(connection.syncedAt).not.toBeNull();

    expect(
      await prisma.bankTransaction.count({ where: { connectionId: connection.id } })
    ).toBeGreaterThan(0);
    expect(redirectMock).toHaveBeenCalledWith("/bank");
  });

  it("connectMockBank is idempotent when a connection exists", async () => {
    await connectMockBank();
    await connectMockBank();

    expect(await prisma.bankConnection.count()).toBe(1);
  });

  it("refreshBank re-syncs an existing connection", async () => {
    await connectMockBank();
    const connection = await prisma.bankConnection.findFirstOrThrow();
    requireAuthMock.mockReset();

    await refreshBank(connection.id, new FormData());

    expect(
      await prisma.bankTransaction.count({ where: { connectionId: connection.id } })
    ).toBeGreaterThan(0);
  });

  it("acceptSuggestion creates a subscription and marks it accepted", async () => {
    await connectMockBank();
    const suggestion = await prisma.suggestedSubscription.findFirstOrThrow();

    await acceptSuggestion(suggestion.id, new FormData());

    const sub = await prisma.subscription.findFirstOrThrow({
      where: { name: suggestion.merchantName },
    });
    expect(Number(sub.priceCurrent)).toBe(Number(suggestion.amount));
    expect(sub.billingCycle).toBe(suggestion.billingCycle);

    const updated = await prisma.suggestedSubscription.findUniqueOrThrow({
      where: { id: suggestion.id },
    });
    expect(updated.status).toBe("accepted");
  });

  it("dismissSuggestion marks the suggestion dismissed", async () => {
    await connectMockBank();
    const suggestion = await prisma.suggestedSubscription.findFirstOrThrow();

    await dismissSuggestion(suggestion.id, new FormData());

    const updated = await prisma.suggestedSubscription.findUniqueOrThrow({
      where: { id: suggestion.id },
    });
    expect(updated.status).toBe("dismissed");
    expect(await prisma.subscription.count({ where: { name: suggestion.merchantName } })).toBe(0);
  });
});