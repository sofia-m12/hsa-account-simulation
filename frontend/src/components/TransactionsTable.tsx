import type { Transaction } from "../data/api";
import { formatUsd } from "../data/api";
import { OutcomeBadge } from "./OutcomeBadge";

type TransactionsTableProps = {
  transactions: Transaction[];
  emptyMessage?: string;
};

function formatReason(reason: string | null): string {
  if (!reason) return "—";
  return reason
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatShortDate(timestamp: string): string {
  const date = new Date(timestamp);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
}

export function TransactionsTable({
  transactions,
  emptyMessage = "No transactions yet.",
}: TransactionsTableProps) {
  if (transactions.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Description</th>
            <th scope="col">Amount</th>
            <th scope="col">Outcome</th>
            <th scope="col">Reason</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{formatShortDate(tx.created_at)}</td>
              <td>{formatTime(tx.created_at)}</td>
              <td>{tx.merchant || "Deposit"}</td>
              <td className="amount">{formatUsd(tx.amount_cents)}</td>
              <td>
                <OutcomeBadge outcome={tx.outcome} />
              </td>
              <td>{formatReason(tx.decline_reason)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
