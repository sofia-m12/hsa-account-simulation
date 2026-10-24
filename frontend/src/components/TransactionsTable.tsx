import type { Transaction } from "../data/api";
import {
  formatReason,
  formatShortDate,
  formatTime,
  formatUsd,
} from "../utils/formatters";
import { OutcomeBadge } from "./OutcomeBadge";

type TransactionsTableProps = {
  transactions: Transaction[];
  emptyMessage?: string;
};

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
