import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { categories } from "../data/api";
import { Button } from "./Button";

export type PurchaseFormValues = {
  amount: string;
  merchant: string;
  category: string;
};

type PurchaseFormProps = {
  cardLast4: string | null;
  cardAvailable: boolean;
  onConfirm: (purchase: PurchaseFormValues) => Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
};

type PurchaseModalProps = {
  open: boolean;
  cardLast4: string | null;
  cardAvailable: boolean;
  onClose: () => void;
  onConfirm: (purchase: PurchaseFormValues) => Promise<void>;
};

const emptyPurchase: PurchaseFormValues = {
  amount: "",
  merchant: "",
  category: categories[0],
};

export function PurchaseForm({
  cardLast4,
  cardAvailable,
  onConfirm,
  onCancel,
  showCancel = true,
}: PurchaseFormProps) {
  const [purchase, setPurchase] = useState(emptyPurchase);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onConfirm(purchase);
    setPurchase(emptyPurchase);
  }

  return (
    <form
      className="modal__form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <p className="field__hint">
        {cardLast4
          ? `Your card ending in ${cardLast4} is ready.`
          : "Issue a simulated card before making a purchase."}
      </p>
      <label className="field">
        <span className="field__label">Amount</span>
        <input
          className="field__input"
          value={purchase.amount}
          onChange={(event) =>
            setPurchase({ ...purchase, amount: event.target.value })
          }
          placeholder="0.00"
          required
        />
      </label>
      <label className="field">
        <span className="field__label">Merchant</span>
        <input
          className="field__input"
          value={purchase.merchant}
          onChange={(event) =>
            setPurchase({ ...purchase, merchant: event.target.value })
          }
          placeholder="Merchant name"
          required
        />
      </label>
      <label className="field">
        <span className="field__label">Category</span>
        <select
          className="field__input"
          value={purchase.category}
          onChange={(event) =>
            setPurchase({ ...purchase, category: event.target.value })
          }
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <div className="modal__actions">
        {showCancel && onCancel && (
          <Button type="button" variant="secondary" icon={X} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" icon={Check} disabled={!cardAvailable}>
          Make purchase
        </Button>
      </div>
    </form>
  );
}

export function PurchaseModal({
  open,
  cardLast4,
  cardAvailable,
  onClose,
  onConfirm,
}: PurchaseModalProps) {
  const titleId = useId();

  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeModal]);

  if (!open) return null;

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
            Make A Purchase
          </h2>
        </header>
        <PurchaseForm
          cardLast4={cardLast4}
          cardAvailable={cardAvailable}
          onConfirm={onConfirm}
          onCancel={closeModal}
        />
      </div>
    </div>
  );
}
