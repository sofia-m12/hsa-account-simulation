import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "../components/Button";
import { Panel } from "../components/Panel";
import type { PurchaseFormValues } from "../components/PurchaseModal";
import { SimulateTransactionModal } from "../components/SimulateTransactionModal";
import { TransactionsTable } from "../components/TransactionsTable";
import { api, type Account, type Transaction } from "../data/api";

type SimulateLocationState = {
  simulate?: boolean;
};

export function TransactionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manualSimulateOpen, setManualSimulateOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [cardToken, setCardToken] = useState("");
  const [cardLast4, setCardLast4] = useState<string | null>(null);
  const simulateFromNav = Boolean(
    (location.state as SimulateLocationState | null)?.simulate,
  );
  const simulateOpen = manualSimulateOpen || simulateFromNav;

  async function loadActivity(nextAccounts: Account[]) {
    const activity = await Promise.all(
      nextAccounts.map((account) => api.transactions(account.id)),
    );
    setTransactions(
      activity.flat().sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  }

  useEffect(() => {
    void (async () => {
      try {
        const nextAccounts = await api.accounts();
        setAccounts(nextAccounts);
        await loadActivity(nextAccounts);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load transactions",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function closeSimulator() {
    setManualSimulateOpen(false);
    setSelectedAccount(null);
    setCardToken("");
    setCardLast4(null);
    if (simulateFromNav) {
      navigate(".", { replace: true, state: null });
    }
  }

  async function handleSelectAccount(account: Account | null) {
    setSelectedAccount(account);
    setCardToken("");
    setCardLast4(null);
    if (!account?.card_last4) return;
    try {
      const card = await api.issueCard(account.id);
      setCardToken(card.token);
      setCardLast4(card.card_last4);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load simulated card",
      );
    }
  }

  async function submitPurchase(purchase: PurchaseFormValues) {
    if (!selectedAccount || !cardToken) return;
    setError("");
    try {
      await api.purchase(selectedAccount.id, {
        ...purchase,
        card_token: cardToken,
      });
      closeSimulator();
      const nextAccounts = await api.accounts();
      setAccounts(nextAccounts);
      await loadActivity(nextAccounts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to process purchase",
      );
    }
  }

  return (
    <div className="page transactions-page">
      <Link className="back-link" to="/">
        Back to Home
      </Link>
      <div className="transactions-page__intro">
        <h1 className="page-title">Transactions</h1>
        <Button icon={ShoppingBag} onClick={() => setManualSimulateOpen(true)}>
          Simulate Transaction
        </Button>
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <Panel>
        {loading ? (
          <p className="empty-state">Loading transactions…</p>
        ) : (
          <TransactionsTable
            transactions={transactions}
            accountNumberById={Object.fromEntries(
              accounts.map((account) => [account.id, account.account_number]),
            )}
            emptyMessage="No transactions yet."
          />
        )}
      </Panel>
      <SimulateTransactionModal
        open={simulateOpen}
        accounts={accounts}
        cardLast4={cardLast4}
        cardAvailable={Boolean(cardToken)}
        onClose={closeSimulator}
        onSelectAccount={(account) => {
          void handleSelectAccount(account);
        }}
        onConfirm={submitPurchase}
      />
    </div>
  );
}
