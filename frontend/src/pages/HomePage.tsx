import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccountsTable } from "../components/AccountsTable";
import { Button } from "../components/Button";
import { CreateAccountModal } from "../components/CreateAccountModal";
import { Panel } from "../components/Panel";
import { TransactionsTable } from "../components/TransactionsTable";
import { api, type Account, type Transaction } from "../data/api";

export function HomePage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void (async () => {
      try {
        const next = await api.accounts();
        setAccounts(next);
        if (next[0]) setTransactions(await api.transactions(next[0].id));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load accounts",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  async function createAccount(holderName: string) {
    setError("");
    try {
      const account = await api.createAccount(holderName);
      setCreateOpen(false);
      navigate(`/accounts/${account.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    }
  }
  return (
    <div className="page home-page">
      <div className="home-page__intro">
        <div>
          <h1 className="page-title">Welcome</h1>
        </div>
        <Button icon={UserPlus} onClick={() => setCreateOpen(true)}>
          Create Account
        </Button>
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="empty-state">Loading accounts…</p>
      ) : (
        <div className="home-page__grid">
          <Panel title="Accounts" className="home-page__accounts">
            <AccountsTable accounts={accounts} />
          </Panel>
          <Panel title="Recent activity" className="home-page__transactions">
            <TransactionsTable transactions={transactions.slice(0, 5)} />
          </Panel>
        </div>
      )}
      <CreateAccountModal
        open={createOpen}
        error={error}
        onClose={() => {
          setCreateOpen(false);
          setError("");
        }}
        onConfirm={createAccount}
      />
    </div>
  );
}
