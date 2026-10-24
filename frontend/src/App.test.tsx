import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

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
