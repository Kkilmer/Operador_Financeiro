import { EntryFrequencyProfile, EntryType, PaymentMethod, Prisma } from "@prisma/client";

import { ensureFixedEntriesForMonth } from "@/lib/application/financial-entry/ensure-fixed-entries-for-month";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { DashboardSummary } from "@/features/dashboard/types/dashboard.types";
import { toMapTotals } from "@/features/dashboard/utils/dashboard-aggregations";
import { calculateMonthlyBalanceSnapshot } from "@/features/dashboard/utils/monthly-balance";
import { formatInstallmentLabel } from "@/features/parcelas/utils/installment-label";

const CATEGORY_CHART_COLORS = [
  "#0f766e",
  "#2563eb",
  "#ea580c",
  "#7c3aed",
  "#dc2626",
  "#0891b2",
  "#65a30d",
  "#d97706",
];

function getReferenceMonthDate(referenceMonth?: string) {
  if (!referenceMonth) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const match = /^(\d{4})-(\d{2})$/.exec(referenceMonth);

  if (!match) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

function getMonthBounds(referenceMonth?: string) {
  const start = getReferenceMonthDate(referenceMonth);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  return { start, end };
}

function getChartYear(referenceMonth?: string, requestedYear?: string) {
  if (requestedYear && /^\d{4}$/.test(requestedYear)) {
    return Number(requestedYear);
  }

  return getReferenceMonthDate(referenceMonth).getFullYear();
}

function getAmountSum<T extends { _sum: { amount: Prisma.Decimal | null } }>(items: T[]) {
  return items.reduce((sum, item) => sum + Number(item._sum.amount ?? 0), 0);
}

function formatEntryDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export async function getDashboardSummary(referenceMonth?: string, requestedYear?: string): Promise<DashboardSummary> {
  const userId = await requireCurrentUserId();
  const { start, end } = getMonthBounds(referenceMonth);
  const chartYear = getChartYear(referenceMonth, requestedYear);
  const chartStart = new Date(chartYear, 0, 1);
  const chartEnd = new Date(chartYear + 1, 0, 1);

  await ensureFixedEntriesForMonth(referenceMonth);

  const where = {
    userId,
    deletedAt: null,
    competenceDate: {
      gte: start,
      lt: end,
    },
  } satisfies Prisma.FinancialEntryWhereInput;

  const beforeMonthWhere = {
    userId,
    deletedAt: null,
    competenceDate: {
      lt: start,
    },
  } satisfies Prisma.FinancialEntryWhereInput;

  const [
    people,
    previousIncomeGrouped,
    previousExpenseGrouped,
    previousSavedGrouped,
    incomeGrouped,
    expenseGrouped,
    savedGrouped,
    installmentGrouped,
    fixedGrouped,
    variableGrouped,
    categoryGrouped,
    personGrouped,
    accountGrouped,
    paymentMethodGrouped,
    monthlyIncome,
    monthlyExpense,
    oldestEntry,
    newestEntry,
    entriesCount,
    recentEntries,
    savedEntries,
    installmentPreview,
  ] = await Promise.all([
    prisma.person.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: { name: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["type"],
      where: { ...beforeMonthWhere, type: EntryType.INCOME },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["type"],
      where: { ...beforeMonthWhere, type: EntryType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["type"],
      where: { ...beforeMonthWhere, type: EntryType.SAVED },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["type"],
      where: { ...where, type: EntryType.INCOME },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["type"],
      where: { ...where, type: EntryType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["type"],
      where: { ...where, type: EntryType.SAVED },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["isInstallment"],
      where: { ...where, type: EntryType.EXPENSE, isInstallment: true },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["frequencyProfile"],
      where: { ...where, type: EntryType.EXPENSE, frequencyProfile: EntryFrequencyProfile.FIXED },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["frequencyProfile"],
      where: { ...where, type: EntryType.EXPENSE, frequencyProfile: EntryFrequencyProfile.VARIABLE },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["categoryId"],
      where: { ...where, type: EntryType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["personId"],
      where: {
        ...where,
        type: EntryType.EXPENSE,
        paymentMethod: {
          not: PaymentMethod.BANK_TRANSFER,
        },
      },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["accountId"],
      where: { ...where, type: EntryType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.financialEntry.groupBy({
      by: ["paymentMethod"],
      where: { ...where, type: EntryType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.financialEntry.findMany({
      where: {
        competenceDate: {
          gte: chartStart,
          lt: chartEnd,
        },
        userId,
        deletedAt: null,
        type: EntryType.INCOME,
      },
      select: {
        competenceDate: true,
        amount: true,
      },
    }),
    prisma.financialEntry.findMany({
      where: {
        competenceDate: {
          gte: chartStart,
          lt: chartEnd,
        },
        userId,
        deletedAt: null,
        type: EntryType.EXPENSE,
      },
      select: {
        competenceDate: true,
        amount: true,
      },
    }),
    prisma.financialEntry.findFirst({
      where: { userId, deletedAt: null },
      orderBy: {
        competenceDate: "asc",
      },
      select: {
        competenceDate: true,
      },
    }),
    prisma.financialEntry.findFirst({
      where: { userId, deletedAt: null },
      orderBy: {
        competenceDate: "desc",
      },
      select: {
        competenceDate: true,
      },
    }),
    prisma.financialEntry.count({ where }),
    prisma.financialEntry.findMany({
      where,
      include: { person: true, account: true, category: true },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.financialEntry.findMany({
      where: { ...where, type: EntryType.SAVED },
      include: { person: true, account: true, category: true },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.installment.findMany({
      where: {
        competenceDate: {
          gte: start,
          lt: end,
        },
        userId,
        financialEntry: {
          deletedAt: null,
        },
      },
      include: {
        installmentPurchase: {
          include: {
            account: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { number: "asc" }],
      take: 3,
    }),
  ]);

  const [categories, groupedPeople, accounts] = await Promise.all([
    prisma.category.findMany({
      where: {
        id: {
          in: categoryGrouped.flatMap((row) => (row.categoryId ? [row.categoryId] : [])),
        },
        userId,
      },
      select: { id: true, name: true, color: true },
    }),
    prisma.person.findMany({
      where: {
        id: {
          in: personGrouped.map((row) => row.personId),
        },
        userId,
      },
      select: { id: true, name: true },
    }),
    prisma.financialAccount.findMany({
      where: {
        id: {
          in: accountGrouped.map((row) => row.accountId),
        },
        userId,
      },
      select: {
        id: true,
        name: true,
        institution: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const categoryLookup = new Map(categories.map((category) => [category.id, category.name]));
  const categoryColorLookup = new Map(categories.map((category) => [category.name, category.color ?? null]));
  const personLookup = new Map(groupedPeople.map((person) => [person.id, person.name]));
  const accountLookup = new Map(accounts.map((account) => [account.id, account.name]));
  const institutionLookup = new Map(accounts.map((account) => [account.id, account.institution?.name ?? account.name]));

  const totalExpense = getAmountSum(expenseGrouped);
  const totalSaved = getAmountSum(savedGrouped);
  const { previousBalance, currentMonthBalance, balance } = calculateMonthlyBalanceSnapshot({
    previousIncome: getAmountSum(previousIncomeGrouped),
    previousExpense: getAmountSum(previousExpenseGrouped),
    previousSaved: getAmountSum(previousSavedGrouped),
    currentIncome: getAmountSum(incomeGrouped),
    currentExpense: totalExpense,
    currentSaved: totalSaved,
  });
  const totalExpenseByPerson = personGrouped.reduce((sum, row) => sum + Number(row._sum.amount ?? 0), 0);
  const incomeByMonth = new Map<number, number>();
  const expenseByMonth = new Map<number, number>();

  monthlyIncome.forEach((entry) => {
    const month = entry.competenceDate.getMonth();
    incomeByMonth.set(month, (incomeByMonth.get(month) ?? 0) + Number(entry.amount));
  });

  monthlyExpense.forEach((entry) => {
    const month = entry.competenceDate.getMonth();
    expenseByMonth.set(month, (expenseByMonth.get(month) ?? 0) + Number(entry.amount));
  });

  const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const monthlyFlow = Array.from({ length: 12 }, (_, monthIndex) => {
    const date = new Date(chartYear, monthIndex, 1);
    const income = incomeByMonth.get(monthIndex) ?? 0;
    const expense = expenseByMonth.get(monthIndex) ?? 0;

    return {
      monthKey: `${chartYear}-${String(monthIndex + 1).padStart(2, "0")}`,
      monthLabel: monthFormatter.format(date).replace(".", ""),
      income,
      expense,
      balance: income - expense,
    };
  });

  const fallbackYear = new Date().getFullYear();
  const firstYear = oldestEntry?.competenceDate.getFullYear() ?? chartYear ?? fallbackYear;
  const lastYear = newestEntry?.competenceDate.getFullYear() ?? chartYear ?? fallbackYear;
  const availableYears = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
  const categoryExpenses = toMapTotals(
    categoryGrouped.map((row) => ({
      key: row.categoryId ? categoryLookup.get(row.categoryId) : null,
      total: Number(row._sum.amount ?? 0),
    })),
    "Sem categoria",
  ).map((item, index) => {
    return {
      ...item,
      percentage: totalExpense > 0 ? (item.total / totalExpense) * 100 : 0,
      color: categoryColorLookup.get(item.label) || CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length],
    };
  });

  return {
    greetingName: people[0]?.name ?? "Kevin",
    referenceMonth: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    chartYear,
    availableYears: availableYears.length > 0 ? availableYears : [chartYear],
    previousBalance,
    currentMonthBalance,
    totalIncome: getAmountSum(incomeGrouped),
    totalExpense,
    totalSaved,
    balance,
    totalInstallments: getAmountSum(installmentGrouped),
    totalFixedExpenses: getAmountSum(fixedGrouped),
    totalVariableExpenses: getAmountSum(variableGrouped),
    entriesCount,
    spendingByCategory: toMapTotals(
      categoryGrouped.map((row) => ({
        key: row.categoryId ? categoryLookup.get(row.categoryId) : null,
        total: Number(row._sum.amount ?? 0),
      })),
      "Sem categoria",
    ),
    categoryExpenses,
    spendingByPerson: toMapTotals(
      personGrouped.map((row) => ({
        key: personLookup.get(row.personId),
        total: Number(row._sum.amount ?? 0),
      })),
      "Sem pessoa",
    ),
    personRanking: toMapTotals(
      personGrouped.map((row) => ({
        key: personLookup.get(row.personId),
        total: Number(row._sum.amount ?? 0),
      })),
      "Sem pessoa",
    ).map((item, index) => ({
      position: index + 1,
      name: item.label,
      total: item.total,
      percentage: totalExpenseByPerson > 0 ? (item.total / totalExpenseByPerson) * 100 : 0,
    })),
    spendingByAccount: toMapTotals(
      accountGrouped.map((row) => ({
        key: accountLookup.get(row.accountId),
        total: Number(row._sum.amount ?? 0),
      })),
      "Conta desconhecida",
    ),
    spendingByInstitution: toMapTotals(
      accountGrouped.map((row) => ({
        key: institutionLookup.get(row.accountId),
        total: Number(row._sum.amount ?? 0),
      })),
      "Sem banco",
    ),
    spendingByPaymentMethod: toMapTotals(
      paymentMethodGrouped.map((row) => ({
        key: row.paymentMethod,
        total: Number(row._sum.amount ?? 0),
      })),
      "Outro",
    ),
    monthlyFlow,
    installmentsPreview: installmentPreview.map((installment) => ({
      id: installment.id,
      cardName: installment.installmentPurchase.account.name,
      amount: Number(installment.amount),
      installmentLabel: formatInstallmentLabel(
        installment.number,
        installment.installmentPurchase.installmentCount,
      ),
    })),
    savedEntries: savedEntries.map((entry) => ({
      id: entry.id,
      description: entry.description,
      amount: Number(entry.amount),
      personName: entry.person.name,
      accountName: entry.account.name,
      destinationName: entry.category?.name ?? null,
      eventDateLabel: formatEntryDate(entry.eventDate),
    })),
    recentEntries: recentEntries.map((entry) => ({
      id: entry.id,
      description: entry.description,
      amount: Number(entry.amount),
      type: entry.type,
      personName: entry.person.name,
      accountName: entry.account.name,
      categoryName: entry.category?.name ?? null,
      eventDateLabel: formatEntryDate(entry.eventDate),
      isInstallment: entry.isInstallment,
    })),
  };
}
