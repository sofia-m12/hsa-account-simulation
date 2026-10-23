import { Link } from 'react-router-dom'
import type { Account } from '../data/mock'
import { formatDate } from '../data/mock'

type AccountsTableProps = {
  accounts: Account[]
}

export function AccountsTable({ accounts }: AccountsTableProps) {
  if (accounts.length === 0) {
    return (
      <p className="empty-state">
        No accounts yet. Create an account to get started.
      </p>
    )
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Acct. #</th>
            <th scope="col">Holder</th>
            <th scope="col">Date created</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>
                <Link className="table-link" to={`/accounts/${account.id}`}>
                  {account.accountNumber}
                </Link>
              </td>
              <td>{account.holder}</td>
              <td>{formatDate(account.dateCreated)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
