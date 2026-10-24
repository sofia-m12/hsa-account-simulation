import { useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import type { Account } from "../data/api";
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
};

export function SimulateTransactionModal({
  open,
  accounts,
  cardLast4,
  cardAvailable,
  onClose,
  onSelectAccount,
  onConfirm,
}: SimulateTransactionModalProps) {
  const titleId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setQuery("");
    setSelectedId(null);
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
    onSelectAccount(null);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={closeModal}>
      <div
        className="modal"
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
        <div className="modal__form">
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
              <span className="account-match__number">
                Acct. # {selected.account_number}
              </span>
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
                  role="listbox"
                  aria-label="Matching accounts"
                >
                  {matches.map((account) => (
                    <li key={account.id} role="option" aria-selected={false}>
                      <button
                        type="button"
                        className="account-match"
                        onClick={() => selectAccount(account)}
                      >
                        <span className="account-match__name">
                          {account.holder_name}
                        </span>
                        <span className="account-match__number">
                          Acct. # {account.account_number}
                        </span>
                        <span className="account-match__balance">
                          {formatUsd(account.balance_cents)}
                        </span>
                      </button>
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
            <PurchaseForm
              cardLast4={cardLast4 ?? selected.card_last4}
              cardAvailable={cardAvailable}
              onConfirm={onConfirm}
              onCancel={closeModal}
            />
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
