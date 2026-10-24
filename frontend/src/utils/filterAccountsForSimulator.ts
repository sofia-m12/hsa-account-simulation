import type { Account } from "../data/api";

export function filterAccountsForSimulator(
  accounts: Account[],
  query: string,
): Account[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return accounts;

  return accounts.filter((account) => {
    const nameMatch = account.holder_name.toLowerCase().includes(normalized);
    const numberMatch = String(account.account_number).includes(normalized);
    return nameMatch || numberMatch;
  });
}
