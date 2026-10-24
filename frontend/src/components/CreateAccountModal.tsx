import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { Button } from "./Button";

type CreateAccountModalProps = {
  open: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (holderName: string) => Promise<void>;
};

export function CreateAccountModal({
  open,
  error: serverError,
  onClose,
  onConfirm,
}: CreateAccountModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [holderName, setHolderName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setHolderName("");
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!holderName.trim()) {
      setError("Enter an account holder name.");
      return;
    }
    await onConfirm(holderName.trim());
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
            Create Account
          </h2>
          <p className="modal__description">
            Start a new HSA account for a holder.
          </p>
        </header>
        <form
          className="modal__form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="field">
            <span className="field__label">Account holder name</span>
            <input
              ref={inputRef}
              className="field__input"
              value={holderName}
              onChange={(event) => {
                setHolderName(event.target.value);
                setError("");
              }}
              aria-invalid={Boolean(error || serverError)}
              aria-describedby={
                error || serverError ? "create-account-error" : undefined
              }
            />
          </label>
          {(error || serverError) && (
            <p id="create-account-error" className="field__error" role="alert">
              {error || serverError}
            </p>
          )}
          <div className="modal__actions">
            <Button
              type="button"
              variant="secondary"
              icon={X}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" icon={Check}>
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
