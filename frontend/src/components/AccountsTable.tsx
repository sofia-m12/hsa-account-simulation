import { Link } from "react-router-dom";
import type { Account } from "../data/api";
import { formatDate, formatUsd } from "../data/api";

type AccountsTableProps = {
  accounts: Account[];
};

export function AccountsTable({ accounts }: AccountsTableProps) {
  if (accounts.length === 0) {
    return (
      <p className="empty-state">
        No accounts yet. Create an account to get started.
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Acct. #</th>
            <th scope="col">Holder</th>
            <th scope="col">Balance</th>
            <th scope="col">Date created</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>
                <Link className="table-link" to={`/accounts/${account.id}`}>
                  {account.account_number}
                </Link>
              </td>
              <td>{account.holder_name}</td>
              <td>{formatUsd(account.balance_cents)}</td>
              <td>{formatDate(account.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
