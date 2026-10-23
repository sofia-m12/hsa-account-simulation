import type { Transaction } from '../data/mock'
import { formatDate, formatUsd } from '../data/mock'
import { OutcomeBadge } from './OutcomeBadge'

type TransactionsTableProps = {
  transactions: Transaction[]
  emptyMessage?: string
}

export function TransactionsTable({
  transactions,
  emptyMessage = 'No transactions yet.',
}: TransactionsTableProps) {
  if (transactions.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Amount</th>
            <th scope="col">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{formatDate(tx.date)}</td>
              <td className="amount">{formatUsd(tx.amountCents)}</td>
              <td>
                <OutcomeBadge outcome={tx.outcome} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
