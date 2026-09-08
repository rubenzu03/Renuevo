import { afterEach, describe, expect, it, vi } from "vitest";

const { gmailListMock, gmailGetMock } = vi.hoisted(() => ({
  gmailListMock: vi.fn(),
  gmailGetMock: vi.fn(),
}));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn(function (this: { setCredentials?: unknown }) {
        this.setCredentials = vi.fn();
      }),
    },
    gmail: vi.fn(() => ({
      users: { messages: { list: gmailListMock, get: gmailGetMock } },
    })),
  },
}));

import {
  GMAIL_INSTITUTION,
  GmailReceiptProvider,
  decodeBase64Url,
  extractMessageBody,
  receiptsToTransactions,
  stripHtml,
} from "./gmail";
import { detectRecurring } from "@/lib/bank/detect";
import type { EmailMessage } from "./types";

const NOW = new Date("2026-08-10T12:00:00Z");

afterEach(() => {
  delete process.env.GMAIL_ACCESS_TOKEN;
  gmailListMock.mockReset();
  gmailGetMock.mockReset();
});

describe("GmailReceiptProvider (mock inbox)", () => {
  it("identifies as the gmail provider", () => {
    const provider = new GmailReceiptProvider(NOW);
    expect(provider.id).toBe("gmail");
    expect(provider.institutionName).toBe(GMAIL_INSTITUTION);
  });

  it("returns a single inbox account", async () => {
    const provider = new GmailReceiptProvider(NOW);
    const accounts = await provider.fetchAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("Gmail inbox");
  });

  it("returns deterministic debit transactions with unique ids", async () => {
    const provider = new GmailReceiptProvider(NOW);
    const a = await provider.fetchTransactions();
    const b = await new GmailReceiptProvider(NOW).fetchTransactions();
    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(b);
    expect(new Set(a.map((tx) => tx.externalId)).size).toBe(a.length);
    for (const tx of a) {
      expect(tx.amount).toBeLessThan(0);
      expect(tx.externalId.startsWith("gmail-")).toBe(true);
    }
  });

  it("produces transactions the detector recognizes as recurring", async () => {
    const provider = new GmailReceiptProvider(NOW);
    const transactions = await provider.fetchTransactions();
    const detected = detectRecurring(transactions);
    const merchants = detected.map((d) => d.merchantName);
    expect(merchants).toContain("netflix");
    expect(merchants).toContain("spotify");
  });
});

describe("GmailReceiptProvider (live API)", () => {
  function encodeUrl(text: string): string {
    return Buffer.from(text)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  it("fetches and parses messages via the Gmail API client", async () => {
    process.env.GMAIL_ACCESS_TOKEN = "token-123";
    gmailListMock.mockResolvedValue({ data: { messages: [{ id: "abc" }] } });
    gmailGetMock.mockResolvedValue({
      data: {
        internalDate: String(new Date("2026-08-03T00:00:00Z").getTime()),
        payload: {
          mimeType: "multipart/alternative",
          headers: [
            { name: "From", value: "receipts@netflix.com" },
            { name: "Subject", value: "Your Netflix receipt" },
          ],
          parts: [
            {
              mimeType: "text/plain",
              body: { data: encodeUrl("We billed €15.49 on 2026-08-03.") },
            },
          ],
        },
      },
    });

    const transactions = await new GmailReceiptProvider(NOW).fetchTransactions();
    expect(gmailListMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "me", maxResults: 100 })
    );
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      externalId: "gmail-abc",
      merchantName: "Netflix",
      amount: -15.49,
      currency: "EUR",
    });
  });

  it("skips messages that fail to load", async () => {
    process.env.GMAIL_ACCESS_TOKEN = "token-123";
    gmailListMock.mockResolvedValue({
      data: { messages: [{ id: "bad" }, {}] },
    });
    gmailGetMock.mockRejectedValue(new Error("not found"));

    const transactions = await new GmailReceiptProvider(NOW).fetchTransactions();
    expect(transactions).toHaveLength(0);
  });

  it("throws when the Gmail API rejects the request", async () => {
    process.env.GMAIL_ACCESS_TOKEN = "bad-token";
    gmailListMock.mockRejectedValue({ code: 401 });
    await expect(
      new GmailReceiptProvider(NOW).fetchTransactions()
    ).rejects.toThrow("Gmail sync failed: 401");
  });
});

describe("receipt helpers", () => {
  it("decodes base64url bodies and strips html", () => {
    const html = "<p>We billed <b>€15.49</b>&nbsp;today</p>";
    const encoded = Buffer.from(html)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    expect(decodeBase64Url(encoded)).toBe(html);
    expect(stripHtml(html)).toBe("We billed €15.49 today");
    expect(
      extractMessageBody({
        mimeType: "text/html",
        body: { data: encoded },
      })
    ).toBe("We billed €15.49 today");
  });

  it("prefers plain text parts in multipart payloads", () => {
    const plain = Buffer.from("paid €9.99").toString("base64url");
    const html = Buffer.from("<p>paid €9.99</p>").toString("base64url");
    expect(
      extractMessageBody({
        mimeType: "multipart/alternative",
        parts: [
          { mimeType: "text/plain", body: { data: plain } },
          { mimeType: "text/html", body: { data: html } },
        ],
      })
    ).toBe("paid €9.99");
  });

  it("returns empty string for payloads without readable bodies", () => {
    expect(extractMessageBody({})).toBe("");
  });
});

describe("receiptsToTransactions", () => {
  it("maps parsed receipts to debit transactions keyed by message id", () => {
    const messages: EmailMessage[] = [
      {
        id: "m1",
        from: "receipts@netflix.com",
        subject: "Your Netflix receipt",
        body: "We billed €15.49 on 2026-08-03.",
        date: new Date("2026-08-03T00:00:00Z"),
      },
      {
        id: "m2",
        from: "friend@example.com",
        subject: "Hello",
        body: "no amount here",
        date: new Date("2026-08-03T00:00:00Z"),
      },
    ];
    const txs = receiptsToTransactions(messages);
    expect(txs).toHaveLength(1);
    expect(txs[0].externalId).toBe("gmail-m1");
    expect(txs[0].amount).toBe(-15.49);
  });
});
