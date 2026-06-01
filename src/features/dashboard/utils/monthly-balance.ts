type BalanceSnapshotInput = {
  previousIncome: number;
  previousExpense: number;
  previousSaved: number;
  currentIncome: number;
  currentExpense: number;
  currentSaved: number;
};

export function calculateMonthlyBalanceSnapshot(input: BalanceSnapshotInput) {
  const previousBalance = input.previousIncome - input.previousExpense - input.previousSaved;
  const currentMonthBalance = input.currentIncome - input.currentExpense - input.currentSaved;

  return {
    previousBalance,
    currentMonthBalance,
    balance: previousBalance + currentMonthBalance,
  };
}
