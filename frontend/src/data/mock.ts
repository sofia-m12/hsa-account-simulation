export type Outcome = "Approved" | "Declined" | "Deposit";

export type Account = {
  id: string;
  accountNumber: string;
  holder: string;
  dateCreated: string;
  cardNumber: string;
  balanceCents: number;
};

export type Transaction = {
  id: string;
  accountId: string;
  date: string;
  amountCents: number;
  outcome: Outcome;
};

export const mockAccounts: Account[] = [
  {
    id: "1",
    accountNumber: "1001",
    holder: "Alex Rivera",
    dateCreated: "2026-01-12",
    cardNumber: "•••• 4821",
    balanceCents: 20000,
  },
  {
    id: "2",
    accountNumber: "1002",
    holder: "Jordan Lee",
    dateCreated: "2026-02-03",
    cardNumber: "•••• 7719",
    balanceCents: 8500,
  },
  {
    id: "3",
    accountNumber: "1003",
    holder: "Sam Patel",
    dateCreated: "2026-03-18",
    cardNumber: "•••• 3056",
    balanceCents: 41250,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "t1",
    accountId: "1",
    date: "2026-10-20",
    amountCents: 4500,
    outcome: "Approved",
  },
  {
    id: "t2",
    accountId: "1",
    date: "2026-10-18",
    amountCents: 10000,
    outcome: "Deposit",
  },
  {
    id: "t3",
    accountId: "2",
    date: "2026-10-15",
    amountCents: 3200,
    outcome: "Declined",
  },
  {
    id: "t4",
    accountId: "3",
    date: "2026-10-12",
    amountCents: 8900,
    outcome: "Approved",
  },
  {
    id: "t5",
    accountId: "1",
    date: "2026-10-08",
    amountCents: 15000,
    outcome: "Deposit",
  },
];
