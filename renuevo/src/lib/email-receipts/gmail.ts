import { subMonths, startOfMonth } from "date-fns";
import { google } from "googleapis";
import type {
  BankProvider,
  RawBankAccount,
  RawBankTransaction,
} from "@/lib/bank/types";
import { parseReceiptEmail } from "./parse";
import type { EmailMessage } from "./types";

const GMAIL_QUERY =
  "(receipt OR invoice OR billing OR billed OR charged) newer_than:365d";

export function createGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export type GmailClient = ReturnType<typeof createGmailClient>;

export const GMAIL_INSTITUTION = "Gmail";
export const GMAIL_ACCOUNT_ID = "gmail-inbox";

type MockReceiptDef = {
  merchantName: string;
  from: string;
  oldAmount: number;
  newAmount: number;
  priceChangeAtOffset: number;
  startOffsetMonths: number;
  dayOfMonth: number;
};

const MOCK_RECEIPTS: MockReceiptDef[] = [
  {
    merchantName: "Netflix",
    from: "receipts@netflix.com",
    oldAmount: 12.99,
    newAmount: 15.49,
    priceChangeAtOffset: 8,
    startOffsetMonths: 11,
    dayOfMonth: 3,
  },
  {
    merchantName: "Spotify",
    from: "no-reply@spotify.com",
    oldAmount: 9.99,
    newAmount: 9.99,
    priceChangeAtOffset: Number.POSITIVE_INFINITY,
    startOffsetMonths: 11,
    dayOfMonth: 8,
  },
  {
    merchantName: "World Gym",
    from: "billing@worldgym.com",
    oldAmount: 29.0,
    newAmount: 29.0,
    priceChangeAtOffset: Number.POSITIVE_INFINITY,
    startOffsetMonths: 11,
    dayOfMonth: 15,
  },
  {
    merchantName: "iCloud",
    from: "no_reply@email.apple.com",
    oldAmount: 2.99,
    newAmount: 2.99,
    priceChangeAtOffset: Number.POSITIVE_INFINITY,
    startOffsetMonths: 11,
    dayOfMonth: 1,
  },
];

function mockMessages(now: Date): EmailMessage[] {
  const messages: EmailMessage[] = [];
  const currentMonth = startOfMonth(now);
  for (const def of MOCK_RECEIPTS) {
    for (let offset = 0; offset <= def.startOffsetMonths; offset++) {
      const month = subMonths(currentMonth, offset);
      const lastDay = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0
      ).getDate();
      const date = new Date(
        month.getFullYear(),
        month.getMonth(),
        Math.min(def.dayOfMonth, lastDay)
      );
      if (date > now) continue;
      const amount =
        offset < def.priceChangeAtOffset ? def.newAmount : def.oldAmount;
      const stamp = date.toISOString().slice(0, 10);
      messages.push({
        id: `mock-${def.merchantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stamp}`,
        from: def.from,
        subject: `Your ${def.merchantName} receipt`,
        body: `Hi there,\n\nWe billed €${amount.toFixed(2)} to your card on ${stamp} for your ${def.merchantName} subscription.\n\nThanks for being a member.`,
        date,
      });
    }
  }
  return messages;
}

export function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf-8");
}

type GmailPayload = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayload[];
};

export function extractMessageBody(payload: GmailPayload): string {
  if (payload.body?.data) {
    const text = decodeBase64Url(payload.body.data);
    if (
      payload.mimeType === "text/plain" ||
      !payload.mimeType?.startsWith("multipart/")
    ) {
      return payload.mimeType === "text/html" ? stripHtml(text) : text;
    }
  }
  if (payload.parts) {
    const plain = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);
    const html = payload.parts.find((p) => p.mimeType === "text/html");
    if (html?.body?.data) return stripHtml(decodeBase64Url(html.body.data));
    for (const part of payload.parts) {
      const nested = extractMessageBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchLiveMessages(
  accessToken: string,
  client: GmailClient = createGmailClient(accessToken)
): Promise<EmailMessage[]> {
  let refs: { id?: string | null }[];
  try {
    const list = await client.users.messages.list({
      userId: "me",
      q: GMAIL_QUERY,
      maxResults: 100,
    });
    refs = list.data.messages ?? [];
  } catch (error) {
    const status =
      (error as { code?: unknown }).code ?? (error as { status?: unknown }).status;
    throw new Error(`Gmail sync failed: ${String(status ?? "unknown")}`);
  }
  const messages: EmailMessage[] = [];
  for (const ref of refs) {
    if (!ref.id) continue;
    let full;
    try {
      full = await client.users.messages.get({
        userId: "me",
        id: ref.id,
        format: "full",
      });
    } catch {
      continue;
    }
    const headersList = full.data.payload?.headers ?? [];
    const header = (name: string) =>
      headersList.find((h) => h.name?.toLowerCase() === name)?.value ?? "";
    messages.push({
      id: ref.id,
      from: header("from"),
      subject: header("subject"),
      body: extractMessageBody((full.data.payload ?? {}) as GmailPayload),
      date: full.data.internalDate
        ? new Date(Number(full.data.internalDate))
        : new Date(),
    });
  }
  return messages;
}

export function receiptsToTransactions(
  messages: EmailMessage[]
): RawBankTransaction[] {
  const transactions: RawBankTransaction[] = [];
  for (const msg of messages) {
    const parsed = parseReceiptEmail(msg);
    if (!parsed) continue;
    transactions.push({
      externalId: `gmail-${msg.id}`,
      merchantName: parsed.merchantName,
      amount: -parsed.amount,
      currency: parsed.currency,
      date: parsed.date,
    });
  }
  return transactions;
}

export class GmailReceiptProvider implements BankProvider {
  readonly id = "gmail" as const;
  readonly institutionName = GMAIL_INSTITUTION;

  constructor(private readonly now: Date = new Date()) {}

  async fetchAccounts(): Promise<RawBankAccount[]> {
    return [
      { externalId: GMAIL_ACCOUNT_ID, name: "Gmail inbox", currency: "EUR" },
    ];
  }

  async fetchTransactions(): Promise<RawBankTransaction[]> {
    const accessToken = process.env.GMAIL_ACCESS_TOKEN;
    const messages = accessToken
      ? await fetchLiveMessages(accessToken)
      : mockMessages(this.now);
    return receiptsToTransactions(messages);
  }
}
