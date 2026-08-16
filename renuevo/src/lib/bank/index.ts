import { MockBankProvider } from "./mock";
import { createPlaidBankProvider } from "./plaid";
import type { BankProvider, BankProviderId } from "./types";

const DEFAULT_PROVIDER: BankProviderId = "mock";

export function createBankProvider(
  connectionId: string,
  now?: Date
): BankProvider {
  const id = (process.env.BANK_PROVIDER ?? DEFAULT_PROVIDER) as BankProviderId;

  switch (id) {
    case "mock":
      return new MockBankProvider(connectionId, now);
    case "plaid":
      return createPlaidBankProvider();
    default:
      throw new Error(`Unknown bank provider: ${id}`);
  }
}