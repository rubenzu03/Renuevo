export type ParsedPaperReceipt = {
  merchantName: string;
  amount: number;
  currency: string;
  purchasedAt: Date | null;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  "€": "EUR",
  $: "USD",
  "£": "GBP",
};

const TOTAL_LABEL =
  /\b(?:total|amount due|balance due|grand total|charged|amount)\b[^\d€$£\n]{0,15}([€$£]?)\s?(\d+(?:[.,]\d{1,2})?)/i;

const ANY_AMOUNT = /([€$£])\s?(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s?(EUR|USD|GBP)/i;

const DATE_PATTERNS = [
  /(\d{4}-\d{2}-\d{2})/,
  /(\d{1,2}\/\d{1,2}\/\d{4})/,
  /(\d{1,2}[.-]\d{1,2}[.-]\d{4})/,
  /([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/,
];

function toAmount(value: string): number | null {
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

function parseDate(text: string): Date | null {
  for (const pattern of DATE_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const parsed = new Date(match[1]);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function merchantFromLines(text: string): string | null {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/[*#=_-]{2,}/g, "").trim())
    .filter((line) => line.length > 1 && /[a-zA-Z]/.test(line));
  if (lines.length === 0) return null;
  const noise = /^(receipt|invoice|thank you|thanks|total|date|order)/i;
  const merchant = lines.find((line) => !noise.test(line)) ?? lines[0];
  return merchant.length <= 60 ? merchant : null;
}

export function parseReceiptText(text: string): ParsedPaperReceipt | null {
  if (!text || !text.trim()) return null;

  const totalMatch = TOTAL_LABEL.exec(text);
  let amount: number | null = null;
  let currency = "EUR";
  if (totalMatch) {
    amount = toAmount(totalMatch[2]);
    const symbol = totalMatch[1];
    if (symbol && CURRENCY_SYMBOLS[symbol]) currency = CURRENCY_SYMBOLS[symbol];
  }
  if (amount === null) {
    const anyMatch = ANY_AMOUNT.exec(text);
    if (!anyMatch) return null;
    const [, symbol, value, value2, code] = anyMatch;
    amount = toAmount(value ?? value2);
    if (amount === null) return null;
    currency = symbol
      ? (CURRENCY_SYMBOLS[symbol] ?? "EUR")
      : (code?.toUpperCase() ?? "EUR");
  }

  const merchantName = merchantFromLines(text);
  if (!merchantName) return null;

  const codeMatch = /\b(EUR|USD|GBP)\b/i.exec(text);
  if (codeMatch && currency === "EUR" && !text.includes("€")) {
    currency = codeMatch[1].toUpperCase();
  }

  return {
    merchantName,
    amount,
    currency,
    purchasedAt: parseDate(text),
  };
}
