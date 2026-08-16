import {
  Configuration,
  CountryCode,
  PlaidApi,
  Products,
} from "plaid";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PLAID_DEFAULT_CURRENCY,
  PLAID_DEFAULT_INSTITUTION,
  PlaidBankProvider,
  createPlaidBankProvider,
} from "./plaid";

function makeProvider() {
  const client = new PlaidApi(new Configuration({}));
  return {
    client,
    provider: new PlaidBankProvider(client, {
      accessToken: "access-sandbox-123",
      institutionName: "Chase Bank",
    }),
  };
}

const accountResponse = {
  data: {
    accounts: [
      {
        account_id: "account-1",
        name: "Main Checking",
        balances: { iso_currency_code: "USD", unofficial_currency_code: null },
      },
      {
        account_id: "account-2",
        name: "Credit Card",
        balances: { iso_currency_code: null, unofficial_currency_code: null },
      },
    ],
  },
} as never;

type SyncPageOverrides = {
  added?: unknown[];
  next_cursor?: string;
  has_more?: boolean;
};

const syncPage = (overrides: SyncPageOverrides = {}): never =>
  ({
    data: {
      added: [
        {
          transaction_id: "tx-1",
          merchant_name: "Netflix",
          name: "NETFLIX.COM",
          amount: 15.49,
          iso_currency_code: "USD",
          unofficial_currency_code: null,
          date: "2026-08-01",
        },
        {
          transaction_id: "tx-2",
          merchant_name: null,
          name: "CHECK #1234",
          amount: -250,
          iso_currency_code: null,
          unofficial_currency_code: null,
          date: "2026-08-02",
        },
      ],
      next_cursor: "",
      has_more: false,
      ...overrides,
    },
  }) as never;

const transaction = (
  id: string,
  merchant: string,
  amount: number,
  date: string
) => ({
  transaction_id: id,
  merchant_name: merchant,
  name: merchant.toUpperCase(),
  amount,
  iso_currency_code: "USD",
  unofficial_currency_code: null,
  date,
});

afterEach(() => {
  delete process.env.PLAID_CLIENT_ID;
  delete process.env.PLAID_SECRET;
  delete process.env.PLAID_ACCESS_TOKEN;
  delete process.env.PLAID_ENV;
});

describe("PlaidBankProvider", () => {
  it("identifies as the plaid provider", () => {
    const { provider } = makeProvider();
    expect(provider.id).toBe("plaid");
    expect(provider.institutionName).toBe("Chase Bank");
  });

  it("defaults the institution name when not provided", () => {
    const client = new PlaidApi(new Configuration({}));
    const provider = new PlaidBankProvider(client, {
      accessToken: "access-sandbox-123",
    });
    expect(provider.institutionName).toBe(PLAID_DEFAULT_INSTITUTION);
  });

  it("maps accounts to the raw shape", async () => {
    const { client, provider } = makeProvider();
    const accountsGet = vi
      .spyOn(client, "accountsGet")
      .mockResolvedValue(accountResponse);

    const accounts = await provider.fetchAccounts();

    expect(accountsGet).toHaveBeenCalledWith({
      access_token: "access-sandbox-123",
    });
    expect(accounts).toEqual([
      { externalId: "account-1", name: "Main Checking", currency: "USD" },
      { externalId: "account-2", name: "Credit Card", currency: "USD" },
    ]);
  });

  it("falls back to the default currency when codes are missing", async () => {
    const { client, provider } = makeProvider();
    vi.spyOn(client, "accountsGet").mockResolvedValue(accountResponse);

    const accounts = await provider.fetchAccounts();

    expect(accounts[1].currency).toBe(PLAID_DEFAULT_CURRENCY);
  });

  it("negates amounts so spends become negative", async () => {
    const { client, provider } = makeProvider();
    vi.spyOn(client, "transactionsSync").mockResolvedValue(syncPage());

    const transactions = await provider.fetchTransactions();

    expect(transactions[0]).toMatchObject({
      externalId: "tx-1",
      merchantName: "Netflix",
      amount: -15.49,
      currency: "USD",
    });
    expect(transactions[0].date).toEqual(new Date("2026-08-01T00:00:00.000Z"));
  });

  it("flips income down to positive amounts", async () => {
    const { client, provider } = makeProvider();
    vi.spyOn(client, "transactionsSync").mockResolvedValue(syncPage());

    const transactions = await provider.fetchTransactions();

    expect(transactions[1].amount).toBe(250);
  });

  it("uses the legacy name when merchant_name is missing", async () => {
    const { client, provider } = makeProvider();
    vi.spyOn(client, "transactionsSync").mockResolvedValue(syncPage());

    const transactions = await provider.fetchTransactions();

    expect(transactions[1].merchantName).toBe("CHECK #1234");
  });

  it("paginates through transactions until has_more is false", async () => {
    const { client, provider } = makeProvider();
    const transactionsSync = vi.spyOn(client, "transactionsSync");
    transactionsSync
      .mockResolvedValueOnce(
        syncPage({
          next_cursor: "cursor-2",
          has_more: true,
          added: [transaction("tx-1", "Netflix", 15.49, "2026-08-01")],
        })
      )
      .mockResolvedValueOnce(
        syncPage({
          added: [transaction("tx-2", "Spotify", 9.99, "2026-08-02")],
        })
      );

    const transactions = await provider.fetchTransactions();

    expect(transactionsSync).toHaveBeenCalledTimes(2);
    expect(transactionsSync).toHaveBeenNthCalledWith(1, {
      access_token: "access-sandbox-123",
      cursor: undefined,
    });
    expect(transactionsSync).toHaveBeenNthCalledWith(2, {
      access_token: "access-sandbox-123",
      cursor: "cursor-2",
    });
    expect(transactions.map((tx) => tx.externalId)).toEqual(["tx-1", "tx-2"]);
  });

  it("returns a link token from createLinkToken", async () => {
    const { client, provider } = makeProvider();
    const linkTokenCreate = vi.spyOn(client, "linkTokenCreate").mockResolvedValue({
      data: { link_token: "link-sandbox-abc" },
    } as never);

    const token = await provider.createLinkToken({
      clientUserId: "user-42",
    });

    expect(token).toBe("link-sandbox-abc");
    expect(linkTokenCreate).toHaveBeenCalledWith({
      client_name: "Renuevo",
      language: "en",
      country_codes: [CountryCode.Us],
      user: { client_user_id: "user-42" },
      products: [Products.Transactions],
    });
  });

  it("exchanges a public token for an access token", async () => {
    const { client, provider } = makeProvider();
    const itemPublicTokenExchange = vi
      .spyOn(client, "itemPublicTokenExchange")
      .mockResolvedValue({
        data: { access_token: "access-sandbox-new", item_id: "item-1" },
      } as never);

    const token = await provider.exchangePublicToken("public-sandbox-xyz");

    expect(token).toBe("access-sandbox-new");
    expect(itemPublicTokenExchange).toHaveBeenCalledWith({
      public_token: "public-sandbox-xyz",
    });
  });

  it("resolves the institution name from the item", async () => {
    const { client, provider } = makeProvider();
    vi.spyOn(client, "itemGet").mockResolvedValue({
      data: { item: { institution_name: "Wells Fargo" } },
    } as never);

    expect(await provider.getInstitutionName()).toBe("Wells Fargo");
  });

  it("looks up the institution when the item has no name", async () => {
    const { client, provider } = makeProvider();
    vi.spyOn(client, "itemGet").mockResolvedValue({
      data: { item: { institution_id: "ins_123" } },
    } as never);
    const institutionsGetById = vi
      .spyOn(client, "institutionsGetById")
      .mockResolvedValue({
        data: { institution: { name: "Chase Bank" } },
      } as never);

    expect(await provider.getInstitutionName()).toBe("Chase Bank");
    expect(institutionsGetById).toHaveBeenCalledWith({
      institution_id: "ins_123",
      country_codes: [CountryCode.Us],
    });
  });

  it("falls back to the configured name without an institution", async () => {
    const { client, provider } = makeProvider();
    vi.spyOn(client, "itemGet").mockResolvedValue({
      data: { item: {} },
    } as never);

    expect(await provider.getInstitutionName()).toBe("Chase Bank");
  });
});

describe("createPlaidBankProvider", () => {
  it("throws when Plaid credentials are missing", () => {
    expect(() => createPlaidBankProvider()).toThrow(
      /Missing Plaid configuration/
    );
  });

  it("builds a provider from environment variables", () => {
    process.env.PLAID_CLIENT_ID = "test-client";
    process.env.PLAID_SECRET = "test-secret";
    process.env.PLAID_ACCESS_TOKEN = "access-sandbox-test";
    process.env.PLAID_ENV = "sandbox";

    const provider = createPlaidBankProvider("Test Bank");

    expect(provider.id).toBe("plaid");
    expect(provider.institutionName).toBe("Test Bank");
  });
});