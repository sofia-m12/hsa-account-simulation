import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
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

async function prepareConcurrencyTest() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Simulate Transaction" }),
  );
  fireEvent.click(await screen.findByRole("button", { name: /Kelly H/i }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Concurrency test" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Concurrency test" }));
  fireEvent.change(screen.getByLabelText("Purchase A amount"), {
    target: { value: "80.00" },
  });
  fireEvent.change(screen.getByLabelText("Purchase A merchant"), {
    target: { value: "Clinic A" },
  });
  fireEvent.change(screen.getByLabelText("Purchase B amount"), {
    target: { value: "50.00" },
  });
  fireEvent.change(screen.getByLabelText("Purchase B merchant"), {
    target: { value: "Clinic B" },
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

  it("starts both concurrent purchases before either resolves and refreshes activity", async () => {
    const pendingPurchases: Array<(response: Response) => void> = [];
    const purchaseBodies: unknown[] = [];
    let accountLoads = 0;
    let activityLoads = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith("/accounts") && !url.includes("/accounts/")) {
        accountLoads += 1;
        return Promise.resolve(jsonResponse([cardedAccount]));
      }
      if (url.includes("/transactions")) {
        activityLoads += 1;
        return Promise.resolve(jsonResponse([]));
      }
      if (url.includes("/card")) {
        return Promise.resolve(
          jsonResponse({
            id: "card-1",
            account_id: cardedAccount.id,
            token: "4111111111111234",
            card_last4: "1234",
            issued_at: "2026-10-24T00:00:00Z",
          }),
        );
      }
      if (url.includes("/purchases")) {
        purchaseBodies.push(JSON.parse(String(init?.body)));
        return new Promise<Response>((resolve) =>
          pendingPurchases.push(resolve),
        );
      }
      return Promise.resolve(jsonResponse({ detail: `Unhandled ${url}` }, 500));
    });
    window.history.pushState({}, "", "/transactions");
    render(<App />);

    await prepareConcurrencyTest();
    fireEvent.click(
      screen.getByRole("button", { name: "Execute both concurrently" }),
    );

    await waitFor(() => expect(pendingPurchases).toHaveLength(2));
    expect(purchaseBodies).toEqual([
      {
        amount: "80.00",
        merchant: "Clinic A",
        category: "Medical",
        card_token: "4111111111111234",
      },
      {
        amount: "50.00",
        merchant: "Clinic B",
        category: "Medical",
        card_token: "4111111111111234",
      },
    ]);

    pendingPurchases[0](jsonResponse({}));
    pendingPurchases[1](jsonResponse({}));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Simulate Transaction" }),
      ).not.toBeInTheDocument(),
    );
    expect(accountLoads).toBe(2);
    expect(activityLoads).toBe(2);
  });

  it("keeps the concurrency form open and retryable after an API failure", async () => {
    let purchaseCount = 0;
    let resolveSecondPurchase: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith("/accounts") && !url.includes("/accounts/")) {
        return Promise.resolve(jsonResponse([cardedAccount]));
      }
      if (url.includes("/transactions")) {
        return Promise.resolve(jsonResponse([]));
      }
      if (url.includes("/card")) {
        return Promise.resolve(
          jsonResponse({
            id: "card-1",
            account_id: cardedAccount.id,
            token: "4111111111111234",
            card_last4: "1234",
            issued_at: "2026-10-24T00:00:00Z",
          }),
        );
      }
      if (url.includes("/purchases")) {
        purchaseCount += 1;
        if (purchaseCount === 1) {
          return Promise.resolve(
            jsonResponse(
              { detail: "Unable to process concurrent purchases" },
              500,
            ),
          );
        }
        return new Promise<Response>((resolve) => {
          resolveSecondPurchase = resolve;
        });
      }
      return Promise.resolve(jsonResponse({ detail: `Unhandled ${url}` }, 500));
    });
    window.history.pushState({}, "", "/transactions");
    render(<App />);

    await prepareConcurrencyTest();
    fireEvent.click(
      screen.getByRole("button", { name: "Execute both concurrently" }),
    );

    await waitFor(() => expect(purchaseCount).toBe(2));
    expect(screen.getByRole("button", { name: "Executing…" })).toBeDisabled();
    expect(
      screen.queryByText("Unable to process concurrent purchases"),
    ).not.toBeInTheDocument();

    resolveSecondPurchase?.(jsonResponse({}));

    const dialog = screen.getByRole("dialog", { name: "Simulate Transaction" });
    expect(
      await within(dialog).findByText("Unable to process concurrent purchases"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Execute both concurrently" }),
    ).toBeEnabled();
  });

  it("reports a refresh failure without presenting completed purchases as retryable", async () => {
    let accountLoads = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith("/accounts") && !url.includes("/accounts/")) {
        accountLoads += 1;
        return Promise.resolve(
          accountLoads === 1
            ? jsonResponse([cardedAccount])
            : jsonResponse({ detail: "Refresh unavailable" }, 500),
        );
      }
      if (url.includes("/transactions"))
        return Promise.resolve(jsonResponse([]));
      if (url.includes("/card")) {
        return Promise.resolve(
          jsonResponse({
            id: "card-1",
            account_id: cardedAccount.id,
            token: "4111111111111234",
            card_last4: "1234",
            issued_at: "2026-10-24T00:00:00Z",
          }),
        );
      }
      if (url.includes("/purchases")) return Promise.resolve(jsonResponse({}));
      return Promise.resolve(jsonResponse({ detail: `Unhandled ${url}` }, 500));
    });
    window.history.pushState({}, "", "/transactions");
    render(<App />);

    await prepareConcurrencyTest();
    fireEvent.click(
      screen.getByRole("button", { name: "Execute both concurrently" }),
    );

    expect(
      await screen.findByText(
        "Purchases completed, but the latest activity could not be refreshed.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Simulate Transaction" }),
    ).not.toBeInTheDocument();
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
