import { EntryFrequencyProfile, EntryType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";
import { DashboardSummary } from "@/features/dashboard/types/dashboard.types";
import { toMapTotals } from "@/features/dashboard/utils/dashboard-aggregations";

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

function getAmountSum<T extends { _sum: { amount: Prisma.Decimal | null } }>(items: T[]) {
  return items.reduce((sum, item) => sum + Number(item._sum.amount ?? 0), 0);
}

export async function getDashboardSummary(referenceMonth?: string): Promise<DashboardSummary> {
  const { start, end } = getMonthBounds(referenceMonth);

  const where = {
    competenceDate: {
      gte: start,
      lt: end,
    },
  } satisfies Prisma.FinancialEntryWhereInput;

  const [
    people,
    incomeGrouped,
    expenseGrouped,
    installmentGrouped,
    fixedGrouped,
    variableGrouped,
    categoryGrouped,
    personGrouped,
    accountGrouped,
    paymentMethodGrouped,
    entriesCount,
    recentEntries,
    installmentPreview,
  ] = await Promise.all([
    prisma.person.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: { name: true },
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
      where: { ...where, type: EntryType.EXPENSE },
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
    prisma.financialEntry.count({ where }),
    prisma.financialEntry.findMany({
      where,
      include: { person: true, account: true },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.installment.findMany({
      where: {
        competenceDate: {
          gte: start,
          lt: end,
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
      },
      select: { id: true, name: true },
    }),
    prisma.person.findMany({
      where: {
        id: {
          in: personGrouped.map((row) => row.personId),
        },
      },
      select: { id: true, name: true },
    }),
    prisma.financialAccount.findMany({
      where: {
        id: {
          in: accountGrouped.map((row) => row.accountId),
        },
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
  const personLookup = new Map(groupedPeople.map((person) => [person.id, person.name]));
  const accountLookup = new Map(accounts.map((account) => [account.id, account.name]));
  const institutionLookup = new Map(accounts.map((account) => [account.id, account.institution?.name ?? account.name]));

  return {
    greetingName: people[0]?.name ?? "Kevin",
    referenceMonth: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    totalIncome: getAmountSum(incomeGrouped),
    totalExpense: getAmountSum(expenseGrouped),
    balance: getAmountSum(incomeGrouped) - getAmountSum(expenseGrouped),
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
    spendingByPerson: toMapTotals(
      personGrouped.map((row) => ({
        key: personLookup.get(row.personId),
        total: Number(row._sum.amount ?? 0),
      })),
      "Sem pessoa",
    ),
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
    installmentsPreview: installmentPreview.map((installment) => ({
      id: installment.id,
      cardName: installment.installmentPurchase.account.name,
      amount: Number(installment.amount),
      installmentLabel: `${installment.number}/${installment.installmentPurchase.installmentCount}`,
    })),
    recentEntries: recentEntries.map((entry) => ({
      id: entry.id,
      description: entry.description,
      amount: Number(entry.amount),
      type: entry.type,
      personName: entry.person.name,
      accountName: entry.account.name,
      eventDate: entry.eventDate.toISOString(),
      isInstallment: entry.isInstallment,
    })),
  };
}
