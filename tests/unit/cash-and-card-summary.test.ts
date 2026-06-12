import { EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  calculateAvailableCashBreakdown,
  calculateCashAndCardSummary,
  groupFutureCreditInvoices,
  shouldIncludeEntryInAvailableCash,
} from "@/features/dashboard/utils/cash-and-card-summary";

describe("calculateCashAndCardSummary", () => {
  it("separa caixa disponível de faturas futuras de cartão", () => {
    const periodStart = new Date(2026, 4, 1);
    const periodEnd = new Date(2026, 5, 1);
    const result = calculateCashAndCardSummary({
      cashEntries: [
        {
          type: EntryType.INCOME,
          amount: 5000,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.OTHER,
          settlementStatus: SettlementStatus.SETTLED,
        },
        {
          type: EntryType.EXPENSE,
          amount: 500,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.PIX,
          settlementStatus: SettlementStatus.SETTLED,
        },
        {
          type: EntryType.EXPENSE,
          amount: 150,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.DEBIT,
          settlementStatus: SettlementStatus.SETTLED,
        },
        {
          type: EntryType.EXPENSE,
          amount: 100,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.CASH,
          settlementStatus: SettlementStatus.SETTLED,
        },
        {
          type: EntryType.SAVED,
          amount: 300,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.OTHER,
          settlementStatus: SettlementStatus.SETTLED,
        },
        {
          type: EntryType.EXPENSE,
          amount: 700,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.CREDIT_SINGLE,
          settlementStatus: SettlementStatus.PENDING,
        },
        {
          type: EntryType.EXPENSE,
          amount: 200,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.CREDIT_INSTALLMENT,
          settlementStatus: SettlementStatus.SETTLED,
        },
      ],
      periodStart,
      periodEnd,
      nextInvoiceAmount: 700,
      futureCardCommitmentsAmount: 1200,
    });

    expect(result.availableCash).toBe(3750);
    expect(result.availableCashBreakdown.totals).toEqual({
      id: "total",
      label: "Total",
      previousBalance: 0,
      income: 5000,
      expenses: 950,
      saved: 300,
      net: 3750,
    });
    expect(result.nextInvoiceTotal).toBe(700);
    expect(result.futureCardCommitments).toBe(1200);
    expect(result.projectedAfterNextInvoice).toBe(3050);
  });

  it("não inclui cartão pendente no caixa disponível antes da fatura", () => {
    expect(
      shouldIncludeEntryInAvailableCash({
        type: EntryType.EXPENSE,
        amount: 100,
        competenceDate: new Date(2026, 4, 1),
        paymentMethod: PaymentMethod.CREDIT_SINGLE,
        settlementStatus: SettlementStatus.PENDING,
      }),
    ).toBe(false);

    expect(
      shouldIncludeEntryInAvailableCash({
        type: EntryType.EXPENSE,
        amount: 100,
        competenceDate: new Date(2026, 4, 1),
        paymentMethod: PaymentMethod.PIX,
        settlementStatus: SettlementStatus.SETTLED,
      }),
    ).toBe(true);
  });

  it("detalha saldo disponível por titular com saldo anterior e período atual", () => {
    const periodStart = new Date(2026, 4, 1);
    const periodEnd = new Date(2026, 5, 1);
    const previousMonth = new Date(2026, 3, 1);
    const result = calculateAvailableCashBreakdown(
      [
        {
          type: EntryType.INCOME,
          amount: 3000,
          competenceDate: previousMonth,
          paymentMethod: PaymentMethod.PIX,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "kevin",
          personName: "Kevin",
        },
        {
          type: EntryType.EXPENSE,
          amount: 2800,
          competenceDate: previousMonth,
          paymentMethod: PaymentMethod.DEBIT,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "kevin",
          personName: "Kevin",
        },
        {
          type: EntryType.INCOME,
          amount: 5000,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.PIX,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "kevin",
          personName: "Kevin",
        },
        {
          type: EntryType.EXPENSE,
          amount: 2300,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.DEBIT,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "kevin",
          personName: "Kevin",
        },
        {
          type: EntryType.SAVED,
          amount: 1000,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.OTHER,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "kevin",
          personName: "Kevin",
        },
        {
          type: EntryType.INCOME,
          amount: 2000,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.PIX,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "isabelle",
          personName: "Isabelle",
        },
        {
          type: EntryType.EXPENSE,
          amount: 800,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.CASH,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "isabelle",
          personName: "Isabelle",
        },
        {
          type: EntryType.SAVED,
          amount: 200,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.OTHER,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "isabelle",
          personName: "Isabelle",
        },
        {
          type: EntryType.EXPENSE,
          amount: 999,
          competenceDate: periodStart,
          paymentMethod: PaymentMethod.CREDIT_SINGLE,
          settlementStatus: SettlementStatus.PENDING,
          personId: "kevin",
          personName: "Kevin",
        },
        {
          type: EntryType.INCOME,
          amount: 9999,
          competenceDate: periodEnd,
          paymentMethod: PaymentMethod.PIX,
          settlementStatus: SettlementStatus.SETTLED,
          personId: "isabelle",
          personName: "Isabelle",
        },
      ],
      {
        start: periodStart,
        end: periodEnd,
      },
    );

    expect(result.totals).toEqual({
      id: "total",
      label: "Total",
      previousBalance: 200,
      income: 7000,
      expenses: 3100,
      saved: 1200,
      net: 2900,
    });
    expect(result.people).toEqual([
      {
        id: "isabelle",
        label: "Isabelle",
        previousBalance: 0,
        income: 2000,
        expenses: 800,
        saved: 200,
        net: 1000,
      },
      {
        id: "kevin",
        label: "Kevin",
        previousBalance: 200,
        income: 5000,
        expenses: 2300,
        saved: 1000,
        net: 1900,
      },
    ]);
  });

  it("agrupa faturas futuras por cartão e competência com subtotais por mês", () => {
    const result = groupFutureCreditInvoices([
      {
        id: "entry-1",
        description: "Mercado",
        cardId: "santander-isabelle",
        cardName: "Santander Isabelle",
        competenceDate: new Date(2026, 6, 1),
        dueDate: new Date(2026, 6, 5),
        amount: 500,
        installment: null,
      },
      {
        id: "entry-2",
        description: "Geladeira",
        cardId: "santander-isabelle",
        cardName: "Santander Isabelle",
        competenceDate: new Date(2026, 6, 1),
        dueDate: new Date(2026, 6, 5),
        amount: 350,
        installment: {
          number: 5,
          total: 10,
        },
      },
      {
        id: "entry-3",
        description: "Restaurante",
        cardId: "bradesco-kevin",
        cardName: "Bradesco Kevin",
        competenceDate: new Date(2026, 6, 1),
        dueDate: new Date(2026, 6, 5),
        amount: 430,
        installment: null,
      },
      {
        id: "entry-4",
        description: "Netflix",
        cardId: "santander-isabelle",
        cardName: "Santander Isabelle",
        competenceDate: new Date(2026, 7, 1),
        dueDate: new Date(2026, 7, 5),
        amount: 720,
        installment: {
          number: 3,
          total: 12,
        },
      },
    ]);

    expect(result.nextInvoice).toEqual({
      monthKey: "2026-07",
      monthLabel: "Julho/2026",
      total: 1280,
      dueDateLabel: "05/07/2026",
      cards: [
        {
          id: "bradesco-kevin-2026-07-05/07/2026",
          cardName: "Bradesco Kevin",
          dueDateLabel: "05/07/2026",
          amount: 430,
        },
        {
          id: "santander-isabelle-2026-07-05/07/2026",
          cardName: "Santander Isabelle",
          dueDateLabel: "05/07/2026",
          amount: 850,
        },
      ],
    });
    expect(result.groups.map(({ monthKey, monthLabel, total }) => ({ monthKey, monthLabel, total }))).toEqual([
      {
        monthKey: "2026-07",
        monthLabel: "Julho/2026",
        total: 1280,
      },
      {
        monthKey: "2026-08",
        monthLabel: "Agosto/2026",
        total: 720,
      },
    ]);
    expect(result.groups[0].invoices[1].items).toEqual([
      {
        id: "entry-2",
        description: "Geladeira",
        amount: 350,
        invoiceMonthLabel: "Julho/2026",
        dueDateLabel: "05/07/2026",
        installmentLabel: "5/10",
        lastInstallmentLabel: "Dezembro/2026",
      },
      {
        id: "entry-1",
        description: "Mercado",
        amount: 500,
        invoiceMonthLabel: "Julho/2026",
        dueDateLabel: "05/07/2026",
        installmentLabel: null,
        lastInstallmentLabel: null,
      },
    ]);
  });
});
