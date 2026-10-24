export type Account = {
  id: string;
  account_number: number;
  holder_name: string;
  currency: string;
  balance_cents: number;
  created_at: string;
  card_last4: string | null;
};

export type Transaction = {
  id: string;
  account_id: string;
  card_id: string | null;
  kind: "DEPOSIT" | "PURCHASE";
  amount_cents: number;
  merchant: string | null;
  category: string | null;
  outcome: "APPROVED" | "DECLINED";
  decline_reason: string | null;
  created_at: string;
};

export type Card = {
  id: string;
  account_id: string;
  token: string;
  card_last4: string;
  issued_at: string;
};
export const categories = [
  "Medical",
  "Dental",
  "Vision",
  "Pharmacy",
  "Travel",
  "Entertainment",
  "Other",
];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(", ")
      : detail;
    throw new Error(message || "Request failed");
  }
  return body as T;
}

export const api = {
  accounts: () => request<Account[]>("/accounts"),
  account: (id: string) => request<Account>(`/accounts/${id}`),
  createAccount: (holder_name: string) =>
    request<Account>("/accounts", {
      method: "POST",
      body: JSON.stringify({ holder_name }),
    }),
  deposit: (id: string, amount: string) =>
    request<{ account: Account; transaction_id: string; amount_cents: number }>(
      `/accounts/${id}/deposits`,
      { method: "POST", body: JSON.stringify({ amount }) },
    ),
  issueCard: (id: string) =>
    request<Card>(`/accounts/${id}/card`, { method: "POST" }),
  transactions: (id: string) =>
    request<Transaction[]>(`/accounts/${id}/transactions`),
  purchase: (
    id: string,
    payload: {
      card_token: string;
      amount: string;
      merchant: string;
      category: string;
    },
  ) =>
    request<{ account: Account; transaction: Transaction }>(
      `/accounts/${id}/purchases`,
      { method: "POST", body: JSON.stringify(payload) },
    ),
};

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
