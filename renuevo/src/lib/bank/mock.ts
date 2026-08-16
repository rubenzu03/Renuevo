import {
  subMonths,
  startOfMonth,
  setDate,
  isAfter,
} from "date-fns";
import type {
  BankProvider,
  RawBankAccount,
  RawBankTransaction,
} from "./types";

export const MOCK_INSTITUTION = "Demo Bank";

type RecurringDef = {
  merchantName: string;
  oldAmount: number;
  newAmount: number;
  priceChangeAtOffset: number;
  startOffsetMonths: number;
  dayOfMonth: number;
};

const RECURRING: RecurringDef[] = [
  {
    merchantName: "Netflix",
    oldAmount: 12.99,
    newAmount: 15.49,
    priceChangeAtOffset: 8,
    startOffsetMonths: 11,
    dayOfMonth: 3,
  },
  {
    merchantName: "Spotify",
    oldAmount: 9.99,
    newAmount: 9.99,
    priceChangeAtOffset: Number.POSITIVE_INFINITY,
    startOffsetMonths: 11,
    dayOfMonth: 8,
  },
  {
    merchantName: "World Gym",
    oldAmount: 29.0,
    newAmount: 29.0,
    priceChangeAtOffset: Number.POSITIVE_INFINITY,
    startOffsetMonths: 11,
    dayOfMonth: 15,
  },
  {
    merchantName: "iCloud",
    oldAmount: 2.99,
    newAmount: 2.99,
    priceChangeAtOffset: Number.POSITIVE_INFINITY,
    startOffsetMonths: 11,
    dayOfMonth: 1,
  },
];

const ONE_OFF_MERCHANTS = [
  "Starbucks",
  "Amazon",
  "Whole Foods",
  "Uber",
  "Shell",
];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function merchantSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function dayInMonth(month: Date, day: number): Date {
  const lastDay = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  return setDate(month, Math.min(day, lastDay));
}

export class MockBankProvider implements BankProvider {
  readonly id = "mock" as const;
  readonly institutionName = MOCK_INSTITUTION;

  private readonly accountId = "checking-0001";
  private readonly now: Date;

  constructor(private readonly connectionId: string, now?: Date) {
    this.now = now ?? new Date();
  }

  private rng(): () => number {
    return mulberry32(hashString(this.connectionId));
  }

  async fetchAccounts(): Promise<RawBankAccount[]> {
    return [
      {
        externalId: this.accountId,
        name: "Main Checking",
        currency: "EUR",
      },
    ];
  }

  private recurringCharges(): RawBankTransaction[] {
    const transactions: RawBankTransaction[] = [];
    const currentMonth = startOfMonth(this.now);
    const rng = this.rng();

    for (const def of RECURRING) {
      for (let offset = 0; offset <= def.startOffsetMonths; offset++) {
        const month = subMonths(currentMonth, offset);
        const jitter = Math.floor(rng() * 3); // 0..2 days around the fixed day
        const date = dayInMonth(
          new Date(month.getFullYear(), month.getMonth(), 1),
          def.dayOfMonth + jitter
        );
        if (isAfter(date, this.now)) continue;

        const amount =
          offset < def.priceChangeAtOffset
            ? def.newAmount
            : def.oldAmount;

        transactions.push({
          externalId: `${this.accountId}-${merchantSlug(def.merchantName)}-${date.toISOString().slice(0, 10)}`,
          merchantName: def.merchantName,
          amount: round2(-amount),
          currency: "EUR",
          date,
        });
      }
    }
    return transactions;
  }

  private oneOffPurchases(): RawBankTransaction[] {
    const transactions: RawBankTransaction[] = [];
    const rng = this.rng();
    const count = 28;
    for (let i = 0; i < count; i++) {
      const merchant = ONE_OFF_MERCHANTS[
        Math.floor(rng() * ONE_OFF_MERCHANTS.length)
      ];
      const amount = round2(1 + rng() * 60);
      const daysAgo = Math.floor(rng() * 365);
      const date = new Date(
        this.now.getFullYear(),
        this.now.getMonth(),
        this.now.getDate() - daysAgo
      );

      transactions.push({
        externalId: `${this.accountId}-oneoff-${i}`,
        merchantName: merchant,
        amount: round2(-amount),
        currency: "EUR",
        date,
      });
    }
    return transactions;
  }

  async fetchTransactions(): Promise<RawBankTransaction[]> {
    return [...this.recurringCharges(), ...this.oneOffPurchases()];
  }
}