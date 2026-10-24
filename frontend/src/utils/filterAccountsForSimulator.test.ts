import { describe, expect, it } from "vitest";
import type { Account } from "../data/api";
import { filterAccountsForSimulator } from "./filterAccountsForSimulator";

const accounts: Account[] = [
  {
    id: "a1",
    account_number: 1000000001,
    holder_name: "Kelly H",
    currency: "USD",
    balance_cents: 10000,
    created_at: "2026-01-01T00:00:00Z",
    card_last4: "1234",
  },
  {
    id: "a2",
    account_number: 1000000004,
    holder_name: "Kelly Nguyen",
    currency: "USD",
    balance_cents: 5000,
    created_at: "2026-01-02T00:00:00Z",
    card_last4: null,
  },
  {
    id: "a3",
    account_number: 1000000007,
    holder_name: "Sam Rivera",
    currency: "USD",
    balance_cents: 0,
    created_at: "2026-01-03T00:00:00Z",
    card_last4: "9999",
  },
];

describe("filterAccountsForSimulator", () => {
  it("matches accounts by holder name without regard to case", () => {
    expect(filterAccountsForSimulator(accounts, "kelly")).toEqual([
      accounts[0],
      accounts[1],
    ]);
  });

  it("matches accounts by account number substring", () => {
    expect(filterAccountsForSimulator(accounts, "000004")).toEqual([
      accounts[1],
    ]);
  });

  it("returns every account when the query is blank", () => {
    expect(filterAccountsForSimulator(accounts, "  ")).toEqual(accounts);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterAccountsForSimulator(accounts, "zzz")).toEqual([]);
  });
});
