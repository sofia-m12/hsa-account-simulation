import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { categories, type Account } from "../data/api";
import { filterAccountsForSimulator } from "../utils/filterAccountsForSimulator";
import { formatUsd } from "../utils/formatters";
import { Button } from "./Button";
import { PurchaseForm, type PurchaseFormValues } from "./PurchaseModal";

type SimulateTransactionModalProps = {
  open: boolean;
  accounts: Account[];
  cardLast4: string | null;
  cardAvailable: boolean;
  onClose: () => void;
  onSelectAccount: (account: Account | null) => void;
  onConfirm: (purchase: PurchaseFormValues) => Promise<void>;
  onConfirmConcurrent: (
    purchases: [PurchaseFormValues, PurchaseFormValues],
  ) => Promise<void>;
  concurrentError: string;
};

const emptyPurchase: PurchaseFormValues = {
  amount: "",
  merchant: "",
  category: categories[0],
};

function parseCents(value: string) {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) return null;
  const [dollars, fraction = ""] = value.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function ConcurrentPurchaseForm({
  balanceCents,
  cardAvailable,
  onCancel,
  onConfirm,
  error,
}: {
  balanceCents: number;
  cardAvailable: boolean;
  onCancel: () => void;
  onConfirm: (
    purchases: [PurchaseFormValues, PurchaseFormValues],
  ) => Promise<void>;
  error: string;
}) {
  const [purchases, setPurchases] = useState<
    [PurchaseFormValues, PurchaseFormValues]
  >([{ ...emptyPurchase }, { ...emptyPurchase }]);
  const [submitting, setSubmitting] = useState(false);
  const cents = purchases.map((purchase) => parseCents(purchase.amount));
  const invalidAmountEntered = purchases.some(
    (purchase, index) => purchase.amount !== "" && cents[index] === null,
  );
  const validAmounts = cents.every((amount) => amount !== null);
  const individuallyAffordable = cents.every(
    (amount) => amount !== null && amount <= balanceCents,
  );
  const merchantsPresent = purchases.every(
    (purchase) => purchase.merchant.trim().length > 0,
  );
  const canSubmit =
    cardAvailable &&
    validAmounts &&
    individuallyAffordable &&
    merchantsPresent &&
    !submitting;

  function updatePurchase(
    index: number,
    field: keyof PurchaseFormValues,
    value: string,
  ) {
    setPurchases((current) => {
      const next: [PurchaseFormValues, PurchaseFormValues] = [
        { ...current[0] },
        { ...current[1] },
      ];
      next[index][field] = value;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm(purchases);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="modal__form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <p className="field__hint">
        Each purchase must be affordable on its own. Complete both merchants and
        enter positive amounts with no more than two decimal places.
      </p>
      {purchases.map((purchase, index) => {
        const label = index === 0 ? "Purchase A" : "Purchase B";
        return (
          <fieldset className="concurrent-purchase" key={label}>
            <legend>{label}</legend>
            <label className="field">
              <span className="field__label">{label} amount</span>
              <input
                className="field__input"
                value={purchase.amount}
                onChange={(event) =>
                  updatePurchase(index, "amount", event.target.value)
                }
                placeholder="0.00"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">{label} merchant</span>
              <input
                className="field__input"
                value={purchase.merchant}
                onChange={(event) =>
                  updatePurchase(index, "merchant", event.target.value)
                }
                placeholder="Merchant name"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">{label} category</span>
              <select
                className="field__input"
                value={purchase.category}
                onChange={(event) =>
                  updatePurchase(index, "category", event.target.value)
                }
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </fieldset>
        );
      })}
      {invalidAmountEntered && (
        <p className="field__error" role="alert">
          Enter positive dollar amounts with no more than two decimal places.
        </p>
      )}
      {validAmounts && !individuallyAffordable && (
        <p className="field__error" role="alert">
          Each purchase must be no more than the current balance.
        </p>
      )}
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <div className="modal__actions">
        <Button type="button" variant="secondary" icon={X} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" icon={Check} disabled={!canSubmit}>
          {submitting ? "Executing…" : "Execute both concurrently"}
        </Button>
      </div>
    </form>
  );
}

export function SimulateTransactionModal({
  open,
  accounts,
  cardLast4,
  cardAvailable,
  onClose,
  onSelectAccount,
  onConfirm,
  onConfirmConcurrent,
  concurrentError,
}: SimulateTransactionModalProps) {
  const titleId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [concurrentMode, setConcurrentMode] = useState(false);

  const closeModal = useCallback(() => {
    setQuery("");
    setSelectedId(null);
    setConcurrentMode(false);
    onSelectAccount(null);
    onClose();
  }, [onClose, onSelectAccount]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeModal]);

  if (!open) return null;

  const matches = filterAccountsForSimulator(accounts, query);
  const selected =
    accounts.find((account) => account.id === selectedId) ?? null;

  function selectAccount(account: Account) {
    setSelectedId(account.id);
    onSelectAccount(account);
  }

  function clearSelection() {
    setSelectedId(null);
    setConcurrentMode(false);
    onSelectAccount(null);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={closeModal}>
      <div
        className="modal modal--simulator"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            Simulate Transaction
          </h2>
        </header>
        <div className="modal__form modal__scroll-area">
          {accounts.length === 0 ? (
            <p className="field__hint">
              No accounts yet.{" "}
              <Link className="inline-link" to="/">
                Create one on Home
              </Link>
              .
            </p>
          ) : selected ? (
            <div className="account-match account-match--selected account-match--confirmed">
              <span className="account-match__name">
                {selected.holder_name}
              </span>
              <Link
                className="inline-link account-match__number"
                to={`/accounts/${selected.id}`}
              >
                Acct. # {selected.account_number}
              </Link>
              <span className="account-match__balance">
                {formatUsd(selected.balance_cents)}
              </span>
              <button
                type="button"
                className="inline-link account-match__change"
                onClick={clearSelection}
              >
                Change account
              </button>
            </div>
          ) : (
            <>
              <label className="field">
                <span className="field__label">Find account</span>
                <input
                  className="field__input"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-controls={listId}
                  autoComplete="off"
                />
              </label>
              {matches.length === 0 ? (
                <p className="field__hint" role="status">
                  No matching accounts.
                </p>
              ) : (
                <ul
                  id={listId}
                  className="account-match-list"
                  aria-label="Matching accounts"
                >
                  {matches.map((account) => (
                    <li key={account.id}>
                      <div
                        className="account-match"
                        onClick={(event) => {
                          if (
                            event.target instanceof Element &&
                            event.target.closest("a")
                          ) {
                            return;
                          }
                          selectAccount(account);
                        }}
                      >
                        <button
                          type="button"
                          className="account-match__select"
                          onClick={(event) => {
                            event.stopPropagation();
                            selectAccount(account);
                          }}
                        >
                          <span className="account-match__name">
                            {account.holder_name}
                          </span>
                        </button>
                        <Link
                          className="inline-link account-match__number"
                          to={`/accounts/${account.id}`}
                        >
                          Acct. # {account.account_number}
                        </Link>
                        <span className="account-match__balance">
                          {formatUsd(account.balance_cents)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {selected && !selected.card_last4 && (
            <p className="field__error" role="alert">
              Issue a simulated card on this account before making a purchase.{" "}
              <Link className="inline-link" to={`/accounts/${selected.id}`}>
                Open account
              </Link>
            </p>
          )}
          {selected?.card_last4 ? (
            <>
              <div className="simulator-mode" aria-label="Simulation mode">
                <Button
                  type="button"
                  variant={concurrentMode ? "secondary" : "primary"}
                  aria-pressed={!concurrentMode}
                  onClick={() => setConcurrentMode(false)}
                >
                  Single purchase
                </Button>
                <Button
                  type="button"
                  variant={concurrentMode ? "primary" : "secondary"}
                  aria-pressed={concurrentMode}
                  onClick={() => setConcurrentMode(true)}
                >
                  Concurrency test
                </Button>
              </div>
              {concurrentMode ? (
                <ConcurrentPurchaseForm
                  balanceCents={selected.balance_cents}
                  cardAvailable={cardAvailable}
                  onConfirm={onConfirmConcurrent}
                  onCancel={closeModal}
                  error={concurrentError}
                />
              ) : (
                <PurchaseForm
                  cardLast4={cardLast4 ?? selected.card_last4}
                  cardAvailable={cardAvailable}
                  onConfirm={onConfirm}
                  onCancel={closeModal}
                />
              )}
            </>
          ) : (
            <div className="modal__actions">
              <Button
                type="button"
                variant="secondary"
                icon={X}
                onClick={closeModal}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
