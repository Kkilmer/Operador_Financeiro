import { DashboardSummary } from "@/features/dashboard/types/dashboard.types";

export function getMobileDashboardMock(referenceMonth: string): DashboardSummary {
  return {
    greetingName: "Kevin",
    referenceMonth,
    totalIncome: 8650,
    totalExpense: 5230.4,
    balance: 3419.6,
    totalInstallments: 742.5,
    totalFixedExpenses: 2150,
    totalVariableExpenses: 3080.4,
    entriesCount: 14,
    spendingByCategory: [
      { label: "Mercado", total: 980.2 },
      { label: "Moradia", total: 1550 },
    ],
    spendingByPerson: [
      { label: "Kevin", total: 2740.9 },
      { label: "Isabelle", total: 2489.5 },
    ],
    spendingByAccount: [
      { label: "Conta Nubank Kevin", total: 1230.4 },
      { label: "Cartao Nubank Kevin", total: 2510.3 },
    ],
    spendingByInstitution: [
      { label: "Nubank", total: 3740.7 },
      { label: "Inter", total: 1489.7 },
    ],
    spendingByPaymentMethod: [
      { label: "PIX", total: 890.4 },
      { label: "CREDIT_INSTALLMENT", total: 742.5 },
    ],
    installmentsPreview: [
      { id: "mock-1", cardName: "Cartao Nubank Kevin", amount: 249.9, installmentLabel: "3/12" },
      { id: "mock-2", cardName: "Cartao Nubank Kevin", amount: 192.3, installmentLabel: "5/10" },
      { id: "mock-3", cardName: "Cartao Inter Isabelle", amount: 300.3, installmentLabel: "2/6" },
    ],
    recentEntries: [
      {
        id: "recent-1",
        description: "Mercado do bairro",
        amount: 84.9,
        type: "EXPENSE",
        personName: "Kevin",
        accountName: "Conta Nubank Kevin",
        eventDate: new Date().toISOString(),
        isInstallment: false,
      },
      {
        id: "recent-2",
        description: "Spotify",
        amount: 21.9,
        type: "EXPENSE",
        personName: "Isabelle",
        accountName: "Cartao Nubank Kevin",
        eventDate: new Date().toISOString(),
        isInstallment: false,
      },
      {
        id: "recent-3",
        description: "Salario",
        amount: 4200,
        type: "INCOME",
        personName: "Kevin",
        accountName: "Conta Nubank Kevin",
        eventDate: new Date().toISOString(),
        isInstallment: false,
      },
    ],
  };
}
