import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { formatUsd } from "../data/mock";
import { Button } from "./Button";

type DepositModalProps = {
  open: boolean;
  accountNumber: string;
  balanceCents: number;
  onClose: () => void;
  onConfirm: (amountCents: number) => void;
};

export function DepositModal({
  open,
  accountNumber,
  balanceCents,
  onClose,
  onConfirm,
}: DepositModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setAmount("");
      setError("");
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a positive dollar amount.");
      return;
    }
    const cents = Math.round(parsed * 100);
    if (cents <= 0) {
      setError("Enter a positive dollar amount.");
      return;
    }
    onConfirm(cents);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            Deposit funds
          </h2>
          <dl className="modal__meta">
            <div>
              <dt>Acct. #</dt>
              <dd>{accountNumber}</dd>
            </div>
            <div>
              <dt>Balance</dt>
              <dd>{formatUsd(balanceCents)}</dd>
            </div>
          </dl>
        </header>

        <form className="modal__form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Amount</span>
            <input
              ref={inputRef}
              className="field__input"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "deposit-error" : undefined}
            />
          </label>
          {error ? (
            <p id="deposit-error" className="field__error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="modal__actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Confirm</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
