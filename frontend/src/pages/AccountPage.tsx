import { useEffect, useState } from "react";
import { CircleDollarSign, CreditCard, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { DepositModal } from "../components/DepositModal";
import { Panel } from "../components/Panel";
import {
  PurchaseModal,
  type PurchaseFormValues,
} from "../components/PurchaseModal";
import { TransactionsTable } from "../components/TransactionsTable";
import { ApiError, api, type Account, type Transaction } from "../data/api";
import { formatUsd } from "../utils/formatters";
import { NotFoundPage } from "./NotFoundPage";

export function AccountPage() {
  const { accountId = "" } = useParams();
  const [account, setAccount] = useState<Account>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositOpen, setDepositOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [cardToken, setCardToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [accountNotFound, setAccountNotFound] = useState(false);
  async function load() {
    try {
      const [a, tx] = await Promise.all([
        api.account(accountId),
        api.transactions(accountId),
      ]);
      setAccount(a);
      setTransactions(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load account");
    }
  }
  useEffect(() => {
    void (async () => {
      let loadedAccount: Account;
      try {
        loadedAccount = await api.account(accountId);
      } catch (err) {
        if (
          err instanceof ApiError &&
          (err.status === 404 || err.status === 422)
        ) {
          setAccountNotFound(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load account");
        return;
      }

      setAccount(loadedAccount);
      setAccountNotFound(false);
      try {
        setTransactions(await api.transactions(accountId));
        if (loadedAccount.card_last4) {
          const card = await api.issueCard(accountId);
          setCardToken(card.token);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load account");
      }
    })();
  }, [accountId]);
  if (accountNotFound) return <NotFoundPage />;
  if (error && !account)
    return (
      <div className="page">
        <p className="field__error">{error}</p>
        <Link className="inline-link" to="/">
          Back to Home
        </Link>
      </div>
    );
  if (!account)
    return (
      <div className="page">
        <p className="empty-state">Loading account…</p>
      </div>
    );
  async function issueCard() {
    try {
      const card = await api.issueCard(accountId);
      setCardToken(card.token);
      setAccount(await api.account(accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to issue card");
    }
  }
  async function deposit(amount: string) {
    try {
      const result = await api.deposit(accountId, amount);
      setAccount(result.account);
      setDepositOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to deposit funds");
    }
  }
  async function submitPurchase(purchase: PurchaseFormValues) {
    setMessage("");
    setError("");
    try {
      const result = await api.purchase(accountId, {
        ...purchase,
        card_token: cardToken,
      });
      setAccount(result.account);
      setMessage(
        result.transaction.outcome === "APPROVED"
          ? "Purchase approved."
          : `Purchase declined: ${result.transaction.decline_reason}`,
      );
      setTransactions(await api.transactions(accountId));
      setPurchaseOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to process purchase",
      );
    }
  }
  return (
    <div className="page account-page">
      <Link className="back-link" to="/">
        Back to Home
      </Link>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      <div className="account-page__layout">
        <div className="account-page__main">
          <Panel title="Account details">
            <div className="account-details">
              <div className="account-details__identity">
                <p className="account-details__holder">{account.holder_name}</p>
                <p className="account-details__card">
                  Card:{" "}
                  {account.card_last4
                    ? `•••• ${account.card_last4}`
                    : "Not issued"}
                </p>
                <p className="account-details__meta">
                  Acct. #: {account.account_number}
                </p>
              </div>
              <div className="account-details__balance">
                <p className="account-details__balance-label">
                  Available balance
                </p>
                <p className="account-details__balance-value">
                  {formatUsd(account.balance_cents)}
                </p>
              </div>
            </div>
          </Panel>
        </div>
        <aside className="account-page__actions">
          <Button
            className="account-action"
            icon={CircleDollarSign}
            onClick={() => setDepositOpen(true)}
          >
            Deposit Funds
          </Button>
          <div className="account-action-row">
            {!account.card_last4 && (
              <Button
                className="account-action"
                icon={CreditCard}
                onClick={issueCard}
              >
                Issue Simulated Card
              </Button>
            )}
            <Button
              className="account-action"
              icon={ShoppingBag}
              onClick={() => setPurchaseOpen(true)}
            >
              Make A Purchase
            </Button>
          </div>
        </aside>
        <Panel className="account-page__activity" title="Activity">
          <TransactionsTable
            transactions={transactions}
            emptyMessage="No activity yet. Deposit Funds to get started."
          />
        </Panel>
      </div>
      <DepositModal
        open={depositOpen}
        accountNumber={String(account.account_number)}
        balanceCents={account.balance_cents}
        onClose={() => setDepositOpen(false)}
        onConfirm={(cents) => void deposit((cents / 100).toFixed(2))}
      />
      <PurchaseModal
        open={purchaseOpen}
        cardLast4={account.card_last4}
        cardAvailable={Boolean(cardToken)}
        onClose={() => setPurchaseOpen(false)}
        onConfirm={submitPurchase}
      />
    </div>
  );
}
