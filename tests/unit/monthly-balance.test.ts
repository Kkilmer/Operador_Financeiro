import { describe, expect, it } from "vitest";

import { calculateMonthlyBalanceSnapshot } from "@/features/dashboard/utils/monthly-balance";

describe("calculateMonthlyBalanceSnapshot", () => {
  it("calcula saldo anterior, saldo do mês e saldo disponível", () => {
    const result = calculateMonthlyBalanceSnapshot({
      previousIncome: 5000,
      previousExpense: 3000,
      previousSaved: 500,
      currentIncome: 2500,
      currentExpense: 1000,
      currentSaved: 300,
    });

    expect(result).toEqual({
      previousBalance: 1500,
      currentMonthBalance: 1200,
      balance: 2700,
    });
  });

  it("mantém saldo negativo quando as saídas superam as entradas", () => {
    const result = calculateMonthlyBalanceSnapshot({
      previousIncome: 1000,
      previousExpense: 1800,
      previousSaved: 0,
      currentIncome: 200,
      currentExpense: 600,
      currentSaved: 100,
    });

    expect(result.previousBalance).toBe(-800);
    expect(result.currentMonthBalance).toBe(-500);
    expect(result.balance).toBe(-1300);
  });
});
