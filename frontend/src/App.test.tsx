import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

const cardedAccount = {
  id: "00000000-0000-0000-0000-000000000001",
  account_number: 1000000001,
  holder_name: "Kelly H",
  currency: "USD",
  balance_cents: 10000,
  created_at: "2026-10-24T00:00:00Z",
  card_last4: "1234",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockDashboardFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/accounts") && !url.includes("/accounts/")) {
      return jsonResponse([cardedAccount]);
    }
    if (url.includes("/transactions")) {
      return jsonResponse([]);
    }
    if (url.includes("/card")) {
      return jsonResponse({
        id: "card-1",
        account_id: cardedAccount.id,
        token: "4111111111111234",
        card_last4: "1234",
        issued_at: "2026-10-24T00:00:00Z",
      });
    }
    if (url.includes("/purchases")) {
      return jsonResponse({
        account: { ...cardedAccount, balance_cents: 7500 },
        transaction: {
          id: "tx-1",
          account_id: cardedAccount.id,
          card_id: "card-1",
          kind: "PURCHASE",
          amount_cents: 2500,
          merchant: "Clinic",
          category: "medical",
          outcome: "APPROVED",
          decline_reason: null,
          created_at: "2026-10-24T01:00:00Z",
        },
      });
    }
    return jsonResponse({ detail: `Unhandled ${url}` }, 500);
  });
}

describe("application routes", () => {
  it("shows a useful not-found page without replacing the unknown URL", () => {
    window.history.pushState({}, "", "/missing-page");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(window.location.pathname).toBe("/missing-page");
  });

  it("continues to render an existing application route", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise<Response>(() => undefined),
    );
    window.history.pushState({}, "", "/transactions");

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Transactions" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Page not found" }),
    ).not.toBeInTheDocument();
  });

  it("shows the not-found page when an account identifier is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Invalid account identifier" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );
    window.history.pushState({}, "", "/accounts/4");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/accounts/4");
  });

  it("shows the not-found page when an account does not exist", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Account not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    window.history.pushState(
      {},
      "",
      "/accounts/00000000-0000-0000-0000-000000000099",
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });

  it("opens the global simulator from Home via the transactions page", async () => {
    mockDashboardFetch();
    window.history.pushState({}, "", "/");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Welcome" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Simulate Transaction" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Simulate Transaction" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/transactions");
  });

  it("opens the global simulator from the transactions page action", async () => {
    mockDashboardFetch();
    window.history.pushState({}, "", "/transactions");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Transactions" }),
    ).toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole("button", { name: "Simulate Transaction" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Simulate Transaction" }),
    ).toBeInTheDocument();
  });

  it("submits a simulated purchase for a carded account and closes the modal", async () => {
    mockDashboardFetch();
    window.history.pushState({}, "", "/transactions");

    render(<App />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Simulate Transaction" }),
    );
    fireEvent.change(await screen.findByLabelText("Find account"), {
      target: { value: "Kelly" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Kelly H/i }));

    await screen.findByLabelText("Amount");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Make purchase" }),
      ).toBeEnabled();
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "25.00" },
    });
    fireEvent.change(screen.getByLabelText("Merchant"), {
      target: { value: "Clinic" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Make purchase" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Simulate Transaction" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Purchase approved.")).not.toBeInTheDocument();
  });

  it("keeps unrelated account-page API failures in the page error state", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "00000000-0000-0000-0000-000000000001",
            account_number: 1000000000,
            holder_name: "Test Holder",
            currency: "USD",
            balance_cents: 0,
            created_at: "2026-10-24T00:00:00Z",
            card_last4: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Activity unavailable" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
    window.history.pushState(
      {},
      "",
      "/accounts/00000000-0000-0000-0000-000000000001",
    );

    render(<App />);

    expect(await screen.findByText("Activity unavailable")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Page not found" }),
    ).not.toBeInTheDocument();
  });
});
