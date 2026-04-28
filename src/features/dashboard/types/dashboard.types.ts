export type DashboardBreakdownItem = {
  label: string;
  total: number;
};

export type DashboardInstallmentPreview = {
  id: string;
  cardName: string;
  amount: number;
  installmentLabel: string;
};

export type DashboardRecentEntry = {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  personName: string;
  accountName: string;
  categoryName: string | null;
  eventDateLabel: string;
  isInstallment: boolean;
};

export type DashboardSummary = {
  greetingName: string;
  referenceMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalInstallments: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  entriesCount: number;
  spendingByCategory: DashboardBreakdownItem[];
  spendingByPerson: DashboardBreakdownItem[];
  spendingByAccount: DashboardBreakdownItem[];
  spendingByInstitution: DashboardBreakdownItem[];
  spendingByPaymentMethod: DashboardBreakdownItem[];
  installmentsPreview: DashboardInstallmentPreview[];
  recentEntries: DashboardRecentEntry[];
};
