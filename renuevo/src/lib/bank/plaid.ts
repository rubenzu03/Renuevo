import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  type Transaction,
} from "plaid";
import type {
  BankProvider,
  RawBankAccount,
  RawBankTransaction,
} from "./types";

export const PLAID_DEFAULT_CURRENCY = "USD";
export const PLAID_DEFAULT_INSTITUTION = "Plaid Bank";

export type PlaidLinkOptions = {
  clientName?: string;
  clientUserId?: string;
  products?: Products[];
  countryCodes?: CountryCode[];
};

export class PlaidBankProvider implements BankProvider {
  readonly id = "plaid" as const;
  readonly institutionName: string;

  private readonly client: PlaidApi;
  private readonly accessToken: string;

  constructor(
    client: PlaidApi,
    options: { accessToken: string; institutionName?: string }
  ) {
    this.client = client;
    this.accessToken = options.accessToken;
    this.institutionName = options.institutionName ?? PLAID_DEFAULT_INSTITUTION;
  }

  async fetchAccounts(): Promise<RawBankAccount[]> {
    const { data } = await this.client.accountsGet({
      access_token: this.accessToken,
    });

    return data.accounts.map((account) => ({
      externalId: account.account_id,
      name: account.name,
      currency:
        account.balances?.iso_currency_code ??
        account.balances?.unofficial_currency_code ??
        PLAID_DEFAULT_CURRENCY,
    }));
  }

  async fetchTransactions(): Promise<RawBankTransaction[]> {
    const transactions: RawBankTransaction[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const { data } = await this.client.transactionsSync({
        access_token: this.accessToken,
        cursor,
      });

      for (const tx of data.added) {
        transactions.push(this.toRawTransaction(tx));
      }

      cursor = data.next_cursor;
      hasMore = data.has_more;
    }

    return transactions;
  }

  async createLinkToken(options: PlaidLinkOptions = {}): Promise<string> {
    const { data } = await this.client.linkTokenCreate({
      client_name: options.clientName ?? "Renuevo",
      language: "en",
      country_codes: options.countryCodes ?? [CountryCode.Us],
      user: { client_user_id: options.clientUserId ?? "renuevo-user" },
      products: options.products ?? [Products.Transactions],
    });

    return data.link_token;
  }

  async exchangePublicToken(publicToken: string): Promise<string> {
    const { data } = await this.client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return data.access_token;
  }

  async getInstitutionName(): Promise<string> {
    const { data } = await this.client.itemGet({
      access_token: this.accessToken,
    });

    if (data.item.institution_name) return data.item.institution_name;

    if (data.item.institution_id) {
      const { data: institution } = await this.client.institutionsGetById({
        institution_id: data.item.institution_id,
        country_codes: [CountryCode.Us],
      });
      return institution.institution.name;
    }

    return this.institutionName;
  }

  private toRawTransaction(tx: Transaction): RawBankTransaction {
    return {
      externalId: tx.transaction_id,
      merchantName: tx.merchant_name ?? tx.name,
      amount: -tx.amount,
      currency:
        tx.iso_currency_code ?? tx.unofficial_currency_code ?? PLAID_DEFAULT_CURRENCY,
      date: new Date(`${tx.date}T00:00:00.000Z`),
    };
  }
}

export function createPlaidBankProvider(
  institutionName?: string
): PlaidBankProvider {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const environment = process.env.PLAID_ENV ?? "sandbox";
  const accessToken = process.env.PLAID_ACCESS_TOKEN;

  if (!clientId || !secret || !accessToken) {
    throw new Error(
      "Missing Plaid configuration: set PLAID_CLIENT_ID, PLAID_SECRET and PLAID_ACCESS_TOKEN"
    );
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments[environment],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  return new PlaidBankProvider(new PlaidApi(configuration), {
    accessToken,
    institutionName,
  });
}