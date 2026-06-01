import { describe, expect, it } from "vitest";

import {
  buildInstallmentSequenceReorderPlan,
  INSTALLMENT_SEQUENCE_CONFLICT_MESSAGE,
  INSTALLMENT_SEQUENCE_OVERFLOW_MESSAGE,
  InstallmentSequenceItem,
} from "@/lib/application/financial-entry/reorder-installment-sequence";

function installment(number: number, overrides: Partial<InstallmentSequenceItem> = {}) {
  return {
    id: `installment-${number}`,
    number,
    dueDate: new Date(2026, number - 1, 5),
    competenceDate: new Date(2026, number - 1, 1),
    createdAt: new Date(2026, number - 1, 1),
    isSettled: false,
    isDeleted: false,
    ...overrides,
  };
}

describe("buildInstallmentSequenceReorderPlan", () => {
  it("transforma 3/10 em 5/10 e continua as futuras como 6/10, 7/10...", () => {
    const plan = buildInstallmentSequenceReorderPlan({
      installments: [
        installment(1),
        installment(2),
        installment(3),
        installment(4),
        installment(5),
        installment(6),
        installment(7),
        installment(8),
      ],
      currentInstallmentId: "installment-3",
      requestedNumber: 5,
      totalInstallments: 10,
    });

    expect(plan.finalUpdates).toEqual([
      { id: "installment-3", number: 5 },
      { id: "installment-4", number: 6 },
      { id: "installment-5", number: 7 },
      { id: "installment-6", number: 8 },
      { id: "installment-7", number: 9 },
      { id: "installment-8", number: 10 },
    ]);
  });

  it("bloqueia quando a sequência das futuras ultrapassa o total da compra", () => {
    expect(() =>
      buildInstallmentSequenceReorderPlan({
        installments: Array.from({ length: 10 }, (_, index) => installment(index + 1)),
        currentInstallmentId: "installment-3",
        requestedNumber: 5,
        totalInstallments: 10,
      }),
    ).toThrow(INSTALLMENT_SEQUENCE_OVERFLOW_MESSAGE);
  });

  it("não altera parcela futura já paga para resolver conflito de numeração", () => {
    expect(() =>
      buildInstallmentSequenceReorderPlan({
        installments: [
          installment(1),
          installment(2),
          installment(3),
          installment(4, { isSettled: true }),
          installment(5),
        ],
        currentInstallmentId: "installment-3",
        requestedNumber: 4,
        totalInstallments: 5,
      }),
    ).toThrow(INSTALLMENT_SEQUENCE_CONFLICT_MESSAGE);
  });
});
