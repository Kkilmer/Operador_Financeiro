import { EntryType } from "@prisma/client";

export type DashboardBreakdownItem = {
  label: string;
  total: number;
};

export type DashboardCategoryExpenseItem = {
  label: string;
  total: number;
  percentage: number;
  color: string;
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
  type: EntryType;
  personName: string;
  accountName: string;
  categoryName: string | null;
  eventDateLabel: string;
  isInstallment: boolean;
};

export type DashboardSavedEntry = {
  id: string;
  description: string;
  amount: number;
  personName: string;
  accountName: string;
  destinationName: string | null;
  eventDateLabel: string;
};

export type DashboardSummary = {
  greetingName: string;
  referenceMonth: string;
  totalIncome: number;
  totalExpense: number;
  totalSaved: number;
  balance: number;
  totalInstallments: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  entriesCount: number;
  spendingByCategory: DashboardBreakdownItem[];
  categoryExpenses: DashboardCategoryExpenseItem[];
  spendingByPerson: DashboardBreakdownItem[];
  spendingByAccount: DashboardBreakdownItem[];
  spendingByInstitution: DashboardBreakdownItem[];
  spendingByPaymentMethod: DashboardBreakdownItem[];
  installmentsPreview: DashboardInstallmentPreview[];
  savedEntries: DashboardSavedEntry[];
  recentEntries: DashboardRecentEntry[];
};
