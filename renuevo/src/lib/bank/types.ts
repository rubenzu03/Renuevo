export type BankProviderId = "mock" | "plaid";

export type RawBankAccount = {
  externalId: string;
  name: string;
  currency: string;
};

export type RawBankTransaction = {
  externalId: string;
  merchantName: string;
  amount: number;
  currency: string;
  date: Date;
};

export interface BankProvider {
  readonly id: BankProviderId;
  readonly institutionName: string;
  fetchAccounts(): Promise<RawBankAccount[]>;
  fetchTransactions(): Promise<RawBankTransaction[]>;
}