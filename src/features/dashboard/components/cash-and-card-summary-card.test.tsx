import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { CashAndCardSummaryCard } from "@/features/dashboard/components/cash-and-card-summary-card";
import { DashboardCashAndCardSummary } from "@/features/dashboard/types/dashboard.types";

const summary: DashboardCashAndCardSummary = {
  availableCash: 2900,
  availableCashBreakdown: {
    totals: {
      id: "total",
      label: "Total",
      previousBalance: 200,
      income: 7000,
      expenses: 3100,
      saved: 1200,
      net: 2900,
    },
    people: [
      {
        id: "kevin",
        label: "Kevin",
        previousBalance: 200,
        income: 5000,
        expenses: 2300,
        saved: 1000,
        net: 1900,
      },
      {
        id: "isabelle",
        label: "Isabelle",
        previousBalance: 0,
        income: 2000,
        expenses: 800,
        saved: 200,
        net: 1000,
      },
    ],
  },
  nextInvoiceTotal: 1119.51,
  nextInvoiceMonthLabel: "Junho/2026",
  nextInvoiceDueDateLabel: "vários vencimentos",
  nextInvoiceCards: [
    {
      id: "invoice-card-1",
      cardName: "Santander Isabelle",
      dueDateLabel: "05/06/2026",
      amount: 700,
    },
    {
      id: "invoice-card-2",
      cardName: "Bradesco Kevin",
      dueDateLabel: "10/06/2026",
      amount: 419.51,
    },
  ],
  futureCardCommitments: 1119.51,
  projectedAfterNextInvoice: 1780.49,
  futureInvoiceMonthGroups: [
    {
      monthKey: "2026-06",
      monthLabel: "Junho/2026",
      total: 1119.51,
      invoices: [
        {
          id: "invoice-card-1",
          cardName: "Santander Isabelle",
          invoiceMonthKey: "2026-06",
          invoiceMonthLabel: "Junho/2026",
          dueDateLabel: "05/06/2026",
          amount: 700,
          items: [
            {
              id: "entry-1",
              description: "Mercado",
              amount: 700,
              invoiceMonthLabel: "Junho/2026",
              dueDateLabel: "05/06/2026",
              installmentLabel: null,
              lastInstallmentLabel: null,
            },
          ],
        },
      ],
    },
  ],
};

describe("CashAndCardSummaryCard", () => {
  it("expande e recolhe o detalhamento do saldo disponível", async () => {
    const user = userEvent.setup();
    render(createElement(CashAndCardSummaryCard, { summary }));

    expect(screen.queryByText("Detalhamento do saldo disponível")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Saldo disponível hoje/i }));

    expect(screen.getByText("Detalhamento do saldo disponível")).toBeInTheDocument();
    expect(screen.getByText("Por titular")).toBeInTheDocument();
    expect(screen.getByText("Kevin")).toBeInTheDocument();
    expect(screen.getByText("Isabelle")).toBeInTheDocument();
    expect(screen.getAllByText("Saldo anterior").length).toBeGreaterThan(0);
    expect(screen.queryByText("Por conta/cartão")).not.toBeInTheDocument();
    expect(screen.getByText("Total consolidado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Saldo disponível hoje/i }));

    expect(screen.queryByText("Detalhamento do saldo disponível")).not.toBeInTheDocument();
  });

  it("mantém detalhes da próxima fatura fechados até o clique no card amarelo", async () => {
    const user = userEvent.setup();
    render(createElement(CashAndCardSummaryCard, { summary }));

    expect(screen.queryByText("Cartões da próxima fatura")).not.toBeInTheDocument();
    expect(screen.queryByText("Detalhes das faturas")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Próxima fatura a pagar/i }));

    expect(screen.getByText("Cartões da próxima fatura")).toBeInTheDocument();
    expect(screen.getByText("Detalhes das faturas")).toBeInTheDocument();
    expect(screen.getAllByText("Santander Isabelle").length).toBeGreaterThan(0);
    expect(screen.getByText("Mercado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Próxima fatura a pagar/i }));

    expect(screen.queryByText("Cartões da próxima fatura")).not.toBeInTheDocument();
  });
});
