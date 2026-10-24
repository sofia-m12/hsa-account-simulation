import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Panel } from "../components/Panel";
import { TransactionsTable } from "../components/TransactionsTable";
import { api, type Transaction } from "../data/api";

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountNumberById, setAccountNumberById] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const accounts = await api.accounts();
        setAccountNumberById(
          Object.fromEntries(
            accounts.map((account) => [account.id, account.account_number]),
          ),
        );
        const activity = await Promise.all(
          accounts.map((account) => api.transactions(account.id)),
        );
        setTransactions(
          activity
            .flat()
            .sort((a, b) => b.created_at.localeCompare(a.created_at)),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load transactions",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page transactions-page">
      <Link className="back-link" to="/">
        Back to Home
      </Link>
      <h1 className="page-title">Transactions</h1>
      <Panel>
        {loading ? (
          <p className="empty-state">Loading transactions…</p>
        ) : error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : (
          <TransactionsTable
            transactions={transactions}
            accountNumberById={accountNumberById}
            emptyMessage="No transactions yet."
          />
        )}
      </Panel>
    </div>
  );
}
