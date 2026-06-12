import { PaymentMethod } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  calculateCreditCardBillingDate,
  isCreditCardPaymentMethod,
  requireCreditCardBillingConfig,
} from "@/lib/application/financial-entry/credit-card-billing";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

describe("calculateCreditCardBillingDate", () => {
  it("calcula a fatura usando fechamento 29 e vencimento 05", () => {
    const cases = [
      { purchaseDate: new Date(2026, 4, 28), billingMonth: "2026-06", dueDate: "2026-06-05" },
      { purchaseDate: new Date(2026, 4, 29), billingMonth: "2026-06", dueDate: "2026-06-05" },
      { purchaseDate: new Date(2026, 4, 30), billingMonth: "2026-07", dueDate: "2026-07-05" },
      { purchaseDate: new Date(2026, 4, 31), billingMonth: "2026-07", dueDate: "2026-07-05" },
    ];

    expect(
      cases.map((testCase) => {
        const result = calculateCreditCardBillingDate({
          purchaseDate: testCase.purchaseDate,
          closingDay: 29,
          dueDay: 5,
        });

        return {
          billingMonth: result.billingMonth,
          dueDate: dateKey(result.dueDate),
        };
      }),
    ).toEqual(cases.map(({ billingMonth, dueDate }) => ({ billingMonth, dueDate })));
  });

  it("mantém a sequência de parcelas mês a mês a partir da primeira fatura correta", () => {
    const installments = [0, 1, 2].map((installmentOffset) =>
      calculateCreditCardBillingDate({
        purchaseDate: new Date(2026, 4, 30),
        closingDay: 29,
        dueDay: 5,
        installmentOffset,
      }),
    );

    expect(installments.map((installment) => installment.billingMonth)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    expect(installments.map((installment) => dateKey(installment.dueDate))).toEqual([
      "2026-07-05",
      "2026-08-05",
      "2026-09-05",
    ]);
  });

  it("identifica apenas métodos de cartão de crédito como crédito", () => {
    expect(isCreditCardPaymentMethod(PaymentMethod.CREDIT_SINGLE)).toBe(true);
    expect(isCreditCardPaymentMethod(PaymentMethod.CREDIT_INSTALLMENT)).toBe(true);
    expect(isCreditCardPaymentMethod(PaymentMethod.PIX)).toBe(false);
    expect(isCreditCardPaymentMethod(PaymentMethod.DEBIT)).toBe(false);
    expect(isCreditCardPaymentMethod(PaymentMethod.CASH)).toBe(false);
  });

  it("exige fechamento e vencimento para cartão de crédito", () => {
    expect(() => requireCreditCardBillingConfig({ closingDay: 29, dueDay: null })).toThrow(
      "Configure o fechamento e o vencimento do cartão antes de lançar compras no crédito.",
    );
  });
});
