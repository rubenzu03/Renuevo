import { afterEach, describe, expect, it } from "vitest";
import { MOCK_INSTITUTION, MockBankProvider } from "./mock";
import { PlaidBankProvider } from "./plaid";
import { createBankProvider } from "./index";

afterEach(() => {
  delete process.env.PLAID_CLIENT_ID;
  delete process.env.PLAID_SECRET;
  delete process.env.PLAID_ACCESS_TOKEN;
  delete process.env.PLAID_ENV;
});

const NOW = new Date("2026-08-10T12:00:00Z");

describe("MockBankProvider", () => {
  it("identifies as the mock provider", () => {
    const provider = new MockBankProvider("conn-1", NOW);
    expect(provider.id).toBe("mock");
    expect(provider.institutionName).toBe(MOCK_INSTITUTION);
  });

  it("returns a single checking account", async () => {
    const provider = new MockBankProvider("conn-1", NOW);
    const accounts = await provider.fetchAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("Main Checking");
    expect(accounts[0].currency).toBe("EUR");
    expect(accounts[0].externalId).toBeTruthy();
  });

  it("returns transactions with a stable shape", async () => {
    const provider = new MockBankProvider("conn-1", NOW);
    const transactions = await provider.fetchTransactions();
    expect(transactions.length).toBeGreaterThan(0);

    for (const tx of transactions) {
      expect(typeof tx.externalId).toBe("string");
      expect(typeof tx.merchantName).toBe("string");
      expect(typeof tx.amount).toBe("number");
      expect(typeof tx.currency).toBe("string");
      expect(tx.date).toBeInstanceOf(Date);
    }
    expect(
      new Set(transactions.map((tx) => tx.externalId)).size
    ).toBe(transactions.length);
  });

  it("is deterministic for the same connection", async () => {
    const a = new MockBankProvider("conn-1", NOW);
    const b = new MockBankProvider("conn-1", NOW);

    const [ta, tb] = await Promise.all([
      a.fetchTransactions(),
      b.fetchTransactions(),
    ]);
    expect(ta).toEqual(tb);
  });

  it("reports negative amounts for recurring charges", async () => {
    const provider = new MockBankProvider("conn-1", NOW);
    const transactions = await provider.fetchTransactions();
    expect(transactions.length).toBeGreaterThan(0);
    for (const tx of transactions) {
      expect(tx.amount).toBeLessThan(0);
    }
  });

  it("includes a recurring Netflix charge with a price change", async () => {
    const provider = new MockBankProvider("conn-1", NOW);
    const transactions = await provider.fetchTransactions();

    const netflix = transactions.filter((tx) =>
      tx.merchantName.includes("Netflix")
    );
    expect(netflix.length).toBeGreaterThan(3);

    const amounts = new Set(netflix.map((tx) => tx.amount));
    expect(amounts.size).toBeGreaterThan(1);
  });

  it("includes recurring charges for the seeded merchants", async () => {
    const provider = new MockBankProvider("conn-1", NOW);
    const transactions = await provider.fetchTransactions();
    const merchants = new Set(transactions.map((tx) => tx.merchantName));

    for (const expected of ["Netflix", "Spotify", "World Gym", "iCloud"]) {
      expect(merchants).toContain(expected);
    }
  });

  it("does not change dates across repeated calls", async () => {
    const provider = new MockBankProvider("conn-1", NOW);
    const first = await provider.fetchTransactions();
    const second = await provider.fetchTransactions();
    const dates = first.map((tx) => tx.date.toISOString());
    expect(second.map((tx) => tx.date.toISOString())).toEqual(dates);
  });
});

describe("createBankProvider", () => {
  it("defaults to the mock provider", () => {
    const provider = createBankProvider("conn-1", NOW);
    expect(provider).toBeInstanceOf(MockBankProvider);
    expect(provider.id).toBe("mock");
  });

  it("selects the mock provider when BANK_PROVIDER=mock", () => {
    process.env.BANK_PROVIDER = "mock";
    const provider = createBankProvider("conn-1", NOW);
    expect(provider.id).toBe("mock");
    delete process.env.BANK_PROVIDER;
  });

  it("selects the plaid provider when BANK_PROVIDER=plaid", () => {
    process.env.BANK_PROVIDER = "plaid";
    process.env.PLAID_CLIENT_ID = "test-client";
    process.env.PLAID_SECRET = "test-secret";
    process.env.PLAID_ACCESS_TOKEN = "access-sandbox-test";
    const provider = createBankProvider("conn-1", NOW);
    expect(provider).toBeInstanceOf(PlaidBankProvider);
    expect(provider.id).toBe("plaid");
  });

  it("throws for an unknown provider", () => {
    process.env.BANK_PROVIDER = "unknown";
    try {
      expect(() => createBankProvider("conn-1", NOW)).toThrow(
        /Unknown bank provider/
      );
    } finally {
      delete process.env.BANK_PROVIDER;
    }
  });
});