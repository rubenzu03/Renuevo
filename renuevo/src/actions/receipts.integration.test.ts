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
import { uploadReceiptAction } from "./receipts";

function form(text = "", image?: File): FormData {
  const fd = new FormData();
  fd.set("text", text);
  if (image) fd.set("image", image);
  return fd;
}

describe("uploadReceiptAction (integration)", () => {
  beforeEach(async () => {
    await resetDb();
    requireAuthMock.mockReset();
    redirectMock.mockReset();
    revalidatePathMock.mockReset();
    delete process.env.OCR_PROVIDER;
    delete process.env.OCR_MOCK_TEXT;
  });

  it("creates a suggestion from pasted receipt text", async () => {
    await uploadReceiptAction(
      null,
      form("WORLD GYM\nTotal: €29.00\n2026-08-15")
    );

    const suggestion = await prisma.suggestedSubscription.findFirstOrThrow();
    expect(suggestion.merchantName).toBe("world gym");
    expect(Number(suggestion.amount)).toBe(29);
    expect(suggestion.currency).toBe("EUR");
    expect(redirectMock).toHaveBeenCalledWith("/bank");
  });

  it("creates a connection when none exists", async () => {
    expect(await prisma.bankConnection.count()).toBe(0);
    await uploadReceiptAction(null, form("iCloud\nTotal €2.99\n"));
    expect(await prisma.bankConnection.count()).toBe(1);
  });

  it("reads the total from an uploaded image via OCR", async () => {
    process.env.OCR_PROVIDER = "mock";
    process.env.OCR_MOCK_TEXT = "Spotify\nTotal: €9.99\n2026-08-01";
    const image = new File([new Uint8Array([1, 2, 3])], "receipt.png", {
      type: "image/png",
    });

    await uploadReceiptAction(null, form("", image));

    const suggestion = await prisma.suggestedSubscription.findFirstOrThrow();
    expect(suggestion.merchantName).toBe("spotify");
    expect(Number(suggestion.amount)).toBe(9.99);
  });

  it("rejects empty submissions", async () => {
    const res = await uploadReceiptAction(null, form(""));
    expect(res).toEqual({ error: "Add receipt text or an image." });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("rejects unreadable receipts", async () => {
    const res = await uploadReceiptAction(null, form("hello there"));
    expect(res).toEqual({
      error: "No merchant or total found on that receipt.",
    });
  });

  it("refuses merchants that were dismissed", async () => {
    await uploadReceiptAction(null, form("WORLD GYM\nTotal: €29.00\n"));
    const suggestion = await prisma.suggestedSubscription.findFirstOrThrow();
    await prisma.suggestedSubscription.update({
      where: { id: suggestion.id },
      data: { status: "dismissed" },
    });
    redirectMock.mockReset();

    const res = await uploadReceiptAction(
      null,
      form("WORLD GYM\nTotal: €29.00\n")
    );
    expect(res).toEqual({ error: "This merchant was dismissed before." });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
