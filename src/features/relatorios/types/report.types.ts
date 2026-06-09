import { EntryType, PaymentMethod } from "@prisma/client";

export const reportPeriodTypes = [
  "monthly",
  "bimonthly",
  "quarterly",
  "semiannual",
  "annual",
  "custom",
] as const;

export type ReportPeriodType = (typeof reportPeriodTypes)[number];

export type ReportScopeType = "mine" | "user" | "all";

export type ReportQueryParams = {
  periodType?: string;
  year?: string;
  month?: string;
  bimester?: string;
  quarter?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  scope?: string;
  targetUserId?: string;
};

export type ReportPeriod = {
  type: ReportPeriodType;
  startDate: Date;
  endDate: Date;
  label: string;
  granularity: "day" | "month";
  warning?: string;
};

export type ReportUserOption = {
  id: string;
  name: string;
  email: string;
};

export type ReportScope = {
  type: ReportScopeType;
  label: string;
  selectedUserId?: string;
  userIdFilter?: string[];
  warning?: string;
};

export type ReportSummary = {
  initialBalance: number;
  finalBalance: number;
  income: number;
  expense: number;
  saved: number;
  netResult: number;
  installmentsTotal: number;
  installmentsSettled: number;
  installmentsPending: number;
  entryCount: number;
  topCategoryName: string | null;
  topPersonName: string | null;
};

export type ReportRankingRow = {
  id: string;
  label: string;
  total: number;
  percentage: number;
  count: number;
};

export type ReportPaymentMethodRow = {
  paymentMethod: PaymentMethod;
  label: string;
  total: number;
  percentage: number;
  count: number;
};

export type ReportAccountRow = {
  id: string;
  label: string;
  total: number;
  installmentTotal: number;
  count: number;
};

export type ReportInstallmentPurchaseRow = {
  id: string;
  description: string;
  accountName: string;
  categoryName: string;
  installmentCount: number;
  installmentsInPeriod: number;
  amountInPeriod: number;
  settledAmount: number;
  pendingAmount: number;
};

export type ReportEvolutionPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
};

export type ReportUserBreakdownRow = {
  userId: string;
  userName: string;
  userEmail: string;
  income: number;
  expense: number;
  saved: number;
  netResult: number;
  entryCount: number;
};

export type ReportEntryRow = {
  id: string;
  userName: string;
  userEmail: string;
  description: string;
  type: EntryType;
  amount: number;
  competenceDate: Date;
  eventDate: Date;
  personName: string;
  accountName: string;
  categoryName: string;
  paymentMethodLabel: string;
};

export type FinancialReport = {
  generatedAt: Date;
  period: ReportPeriod;
  scope: ReportScope;
  currentUser: ReportUserOption & { role: "ADMIN" | "USER" };
  availableUsers: ReportUserOption[];
  summary: ReportSummary;
  categoryRanking: ReportRankingRow[];
  personRanking: ReportRankingRow[];
  paymentMethods: ReportPaymentMethodRow[];
  accounts: ReportAccountRow[];
  installments: {
    totalAmount: number;
    settledCount: number;
    pendingCount: number;
    settledAmount: number;
    pendingAmount: number;
    purchases: ReportInstallmentPurchaseRow[];
  };
  evolution: ReportEvolutionPoint[];
  userBreakdown: ReportUserBreakdownRow[];
  entries: ReportEntryRow[];
};
