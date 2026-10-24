import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Account } from "../data/api";
import { SimulateTransactionModal } from "./SimulateTransactionModal";

const accounts: Account[] = [
  {
    id: "a1",
    account_number: 1000000001,
    holder_name: "Kelly H",
    currency: "USD",
    balance_cents: 10000,
    created_at: "2026-01-01T00:00:00Z",
    card_last4: "1234",
  },
  {
    id: "a2",
    account_number: 1000000004,
    holder_name: "Kelly Nguyen",
    currency: "USD",
    balance_cents: 5000,
    created_at: "2026-01-02T00:00:00Z",
    card_last4: null,
  },
];

function renderModal(
  props: Partial<Parameters<typeof SimulateTransactionModal>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <SimulateTransactionModal
        open
        accounts={accounts}
        cardLast4={null}
        cardAvailable={false}
        onClose={vi.fn()}
        onSelectAccount={vi.fn()}
        onConfirm={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("SimulateTransactionModal", () => {
  it("lists matching accounts with holder name, account number, and balance", () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("Find account"), {
      target: { value: "kelly" },
    });

    expect(screen.getByText("Kelly H")).toBeInTheDocument();
    expect(screen.getByText("Acct. # 1000000001")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("Kelly Nguyen")).toBeInTheDocument();
    expect(screen.getByText("Acct. # 1000000004")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.queryByText(/••••|1234/)).not.toBeInTheDocument();
  });

  it("blocks purchase and links to the account when no card is issued", () => {
    const onSelectAccount = vi.fn();
    renderModal({ onSelectAccount });

    fireEvent.change(screen.getByLabelText("Find account"), {
      target: { value: "Nguyen" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kelly Nguyen/i }));

    expect(onSelectAccount).toHaveBeenCalledWith(accounts[1]);
    expect(screen.queryByLabelText("Find account")).not.toBeInTheDocument();
    expect(screen.queryByText("Kelly H")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Issue a simulated card on this account before making a purchase/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open account" })).toHaveAttribute(
      "href",
      "/accounts/a2",
    );
    expect(
      screen.queryByRole("heading", { name: "Make A Purchase" }),
    ).not.toBeInTheDocument();
  });

  it("hides the match list after an account is selected and can reopen it", () => {
    renderModal();

    fireEvent.change(screen.getByLabelText("Find account"), {
      target: { value: "kelly" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kelly H/i }));

    expect(screen.queryByLabelText("Find account")).not.toBeInTheDocument();
    expect(screen.queryByText("Kelly Nguyen")).not.toBeInTheDocument();
    expect(screen.getByText("Kelly H")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change account" }));

    expect(screen.getByLabelText("Find account")).toBeInTheDocument();
    expect(screen.getByText("Kelly Nguyen")).toBeInTheDocument();
  });

  it("shows purchase fields when a carded account is selected and a token is ready", () => {
    renderModal({
      cardLast4: "1234",
      cardAvailable: true,
    });

    fireEvent.change(screen.getByLabelText("Find account"), {
      target: { value: "Kelly H" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kelly H/i }));

    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Merchant")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make purchase" })).toBeEnabled();
    expect(screen.queryByText(/••••/)).not.toBeInTheDocument();
  });

  it("prompts the reviewer to create an account when none exist", () => {
    renderModal({ accounts: [] });

    expect(screen.getByText(/No accounts yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create one on Home" }),
    ).toHaveAttribute("href", "/");
  });

  it("keeps the query and reports when nothing matches", () => {
    renderModal();

    const input = screen.getByLabelText("Find account");
    fireEvent.change(input, { target: { value: "zzz" } });

    expect(screen.getByText("No matching accounts.")).toBeInTheDocument();
    expect(input).toHaveValue("zzz");
  });
});
