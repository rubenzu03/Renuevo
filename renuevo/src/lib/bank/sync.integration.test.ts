import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "../../../tests/db";
import { prisma } from "@/lib/prisma";
import { syncBankAccount } from "./sync";

const NOW = new Date("2026-08-10T12:00:00.000Z");

async function seedConnection(): Promise<string> {
  const connection = await prisma.bankConnection.create({
    data: { institutionName: "Demo Bank" },
  });
  return connection.id;
}

describe("syncBankAccount", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("throws for an unknown connection", async () => {
    await expect(syncBankAccount("missing", NOW)).rejects.toThrow(
      /not found/
    );
  });

  it("imports transactions and detects suggestions", async () => {
    const id = await seedConnection();

    const result = await syncBankAccount(id, NOW);

    expect(result.transactions).toBeGreaterThan(0);
    expect(
      await prisma.bankTransaction.count({ where: { connectionId: id } })
    ).toBe(result.transactions);

    const suggestions = await prisma.suggestedSubscription.findMany({
      where: { connectionId: id },
    });
    expect(suggestions.length).toBeGreaterThan(0);

    const netflix = suggestions.find((s) => s.merchantName.includes("netflix"));
    expect(netflix).toBeDefined();
    expect(netflix?.status).toBe("pending");
  });

  it("is idempotent when run twice", async () => {
    const id = await seedConnection();

    await syncBankAccount(id, NOW);
    const first = await syncBankAccount(id, NOW);

    expect(
      await prisma.bankTransaction.count({ where: { connectionId: id } })
    ).toBe(first.transactions);

    const suggestions = await prisma.suggestedSubscription.findMany({
      where: { connectionId: id },
    });
    const merchants = suggestions.map((s) => s.merchantName);
    expect(new Set(merchants).size).toBe(merchants.length);
  });

  it("updates the connection syncedAt and keeps status connected", async () => {
    const id = await seedConnection();

    await syncBankAccount(id, NOW);

    const connection = await prisma.bankConnection.findUniqueOrThrow({
      where: { id },
    });
    expect(connection.syncedAt).toEqual(NOW);
    expect(connection.status).toBe("connected");
  });

  it("does not re-suggest a dismissed suggestion", async () => {
    const id = await seedConnection();
    await syncBankAccount(id, NOW);

    const netflix = await prisma.suggestedSubscription.findFirstOrThrow({
      where: { connectionId: id, merchantName: { contains: "netflix" } },
    });
    await prisma.suggestedSubscription.update({
      where: { id: netflix.id },
      data: { status: "dismissed" },
    });

    await syncBankAccount(id, NOW);

    const after = await prisma.suggestedSubscription.findUniqueOrThrow({
      where: { id: netflix.id },
    });
    expect(after.status).toBe("dismissed");
  });

  it("updates price/date fields for accepted suggestions on re-sync", async () => {
    const id = await seedConnection();
    await syncBankAccount(id, NOW);

    const netflix = await prisma.suggestedSubscription.findFirstOrThrow({
      where: { connectionId: id, merchantName: { contains: "netflix" } },
    });
    await prisma.suggestedSubscription.update({
      where: { id: netflix.id },
      data: { status: "accepted" },
    });

    await syncBankAccount(id, NOW);

    const after = await prisma.suggestedSubscription.findUniqueOrThrow({
      where: { id: netflix.id },
    });
    expect(after.status).toBe("accepted");
    expect(Number(after.amount)).toBeGreaterThan(0);
  });
});