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

export type DashboardPersonRankingItem = {
  position: number;
  name: string;
  total: number;
  percentage: number;
};

export type DashboardMonthlyFlowItem = {
  monthKey: string;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
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

export type DashboardFutureInvoiceItem = {
  id: string;
  description: string;
  amount: number;
  invoiceMonthLabel: string;
  dueDateLabel: string;
  installmentLabel: string | null;
  lastInstallmentLabel: string | null;
};

export type DashboardFutureInvoiceCard = {
  id: string;
  cardName: string;
  invoiceMonthKey: string;
  invoiceMonthLabel: string;
  dueDateLabel: string;
  amount: number;
  items: DashboardFutureInvoiceItem[];
};

export type DashboardFutureInvoiceMonthGroup = {
  monthKey: string;
  monthLabel: string;
  total: number;
  invoices: DashboardFutureInvoiceCard[];
};

export type DashboardNextInvoiceCard = {
  id: string;
  cardName: string;
  dueDateLabel: string;
  amount: number;
};

export type DashboardAvailableCashBreakdownGroup = {
  id: string;
  label: string;
  previousBalance: number;
  income: number;
  expenses: number;
  saved: number;
  net: number;
};

export type DashboardAvailableCashBreakdown = {
  totals: DashboardAvailableCashBreakdownGroup;
  people: DashboardAvailableCashBreakdownGroup[];
};

export type DashboardCashAndCardSummary = {
  availableCash: number;
  availableCashBreakdown: DashboardAvailableCashBreakdown;
  nextInvoiceTotal: number;
  nextInvoiceMonthLabel: string | null;
  nextInvoiceDueDateLabel: string | null;
  nextInvoiceCards: DashboardNextInvoiceCard[];
  futureCardCommitments: number;
  projectedAfterNextInvoice: number;
  futureInvoiceMonthGroups: DashboardFutureInvoiceMonthGroup[];
};

export type DashboardSummary = {
  greetingName: string;
  referenceMonth: string;
  chartYear: number;
  availableYears: number[];
  previousBalance: number;
  currentMonthBalance: number;
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
  personRanking: DashboardPersonRankingItem[];
  spendingByAccount: DashboardBreakdownItem[];
  spendingByInstitution: DashboardBreakdownItem[];
  spendingByPaymentMethod: DashboardBreakdownItem[];
  monthlyFlow: DashboardMonthlyFlowItem[];
  cashAndCardSummary: DashboardCashAndCardSummary;
  installmentsPreview: DashboardInstallmentPreview[];
  savedEntries: DashboardSavedEntry[];
  recentEntries: DashboardRecentEntry[];
};
