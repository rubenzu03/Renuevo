import type { EmailMessage, ParsedReceipt } from "./types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  "€": "EUR",
  $: "USD",
  "£": "GBP",
};

const AMOUNT_PATTERNS = [
  /(?:total|amount|charged|billed|paid|payment of|price)[^\d€$£]{0,20}([€$£])\s?(\d+(?:[.,]\d{1,2})?)/i,
  /([€$£])\s?(\d+(?:[.,]\d{1,2})?)/,
  /\b(EUR|USD|GBP)\s?(\d+(?:[.,]\d{1,2})?)/i,
  /(\d+(?:[.,]\d{1,2})?)\s?(EUR|USD|GBP)/i,
];

const SUBJECT_MERCHANT_PATTERNS = [
  /your\s+(.+?)\s+(receipt|bill|invoice|payment|subscription)/i,
  /(.+?)\s+(receipt|bill|invoice|payment confirmation)/i,
  /payment to\s+(.+)/i,
  /you paid\s+(.+)/i,
];

const DATE_PATTERNS = [
  /on\s+(\d{4}-\d{2}-\d{2})/,
  /(\d{4}-\d{2}-\d{2})/,
  /on\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/,
  /(\d{1,2}\/\d{1,2}\/\d{4})/,
];

function parseAmount(text: string): { amount: number; currency: string } | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const [, first, second] = match;
    let symbol: string | undefined;
    let value: string;
    if (CURRENCY_SYMBOLS[first] ?? /^[A-Z]{3}$/i.test(first)) {
      symbol = first;
      value = second;
    } else if (CURRENCY_SYMBOLS[second] ?? /^[A-Z]{3}$/i.test(second)) {
      symbol = second;
      value = first;
    } else {
      continue;
    }
    const amount = Number(value.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const currency =
      CURRENCY_SYMBOLS[symbol] ?? symbol.toUpperCase();
    return { amount: Math.round(amount * 100) / 100, currency };
  }
  return null;
}

function parseDate(text: string, fallback: Date): Date {
  for (const pattern of DATE_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const parsed = new Date(match[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

function merchantFromSubject(subject: string): string | null {
  for (const pattern of SUBJECT_MERCHANT_PATTERNS) {
    const match = pattern.exec(subject.trim());
    if (!match) continue;
    const name = match[1].trim().replace(/^the\s+/i, "");
    if (name.length > 1 && name.length <= 60) return name;
  }
  return null;
}

function merchantFromAddress(from: string): string | null {
  const addr = from.match(/@([\w-]+)\./);
  if (!addr) return null;
  const domain = addr[1].toLowerCase();
  if (["gmail", "googlemail", "yahoo", "outlook", "hotmail"].includes(domain)) {
    return null;
  }
  return domain.charAt(0).toUpperCase() + domain.slice(1);
}

export function parseReceiptEmail(msg: EmailMessage): ParsedReceipt | null {
  const haystack = `${msg.subject}\n${msg.body}`;
  const parsed = parseAmount(haystack);
  if (!parsed) return null;

  const merchantName =
    merchantFromSubject(msg.subject) ??
    merchantFromAddress(msg.from) ??
    msg.from;
  const date = parseDate(haystack, msg.date);

  return {
    merchantName,
    amount: parsed.amount,
    currency: parsed.currency,
    date,
  };
}

export function parseReceiptEmails(msgs: EmailMessage[]): ParsedReceipt[] {
  const receipts: ParsedReceipt[] = [];
  for (const msg of msgs) {
    const parsed = parseReceiptEmail(msg);
    if (parsed) receipts.push(parsed);
  }
  return receipts;
}
