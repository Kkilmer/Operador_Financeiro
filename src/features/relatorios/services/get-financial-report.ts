import { EntryType, InstallmentStatus, PaymentMethod, Prisma } from "@prisma/client";

import {
  FinancialReport,
  ReportAccountRow,
  ReportEntryRow,
  ReportEvolutionPoint,
  ReportInstallmentPurchaseRow,
  ReportPaymentMethodRow,
  ReportQueryParams,
  ReportRankingRow,
  ReportUserBreakdownRow,
  ReportUserOption,
} from "@/features/relatorios/types/report.types";
import { getReportPeriod } from "@/features/relatorios/utils/report-period";
import { resolveReportScope } from "@/features/relatorios/utils/report-scope";
import { getPaymentMethodLabel } from "@/features/lancamentos/utils/financial-entry-presentations";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

type ReportEntryPayload = Prisma.FinancialEntryGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    person: { select: { id: true; name: true } };
    account: { select: { id: true; name: true } };
    category: { select: { id: true; name: true; color: true } };
    installment: {
      include: {
        installmentPurchase: {
          select: {
            id: true;
            description: true;
            totalAmount: true;
            installmentCount: true;
            account: { select: { name: true } };
            category: { select: { name: true } };
          };
        };
      };
    };
  };
}>;

function amount(value: Prisma.Decimal | number | null | undefined) {
  return Number(value ?? 0);
}

function sumEntries(entries: ReportEntryPayload[], type: EntryType) {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + amount(entry.amount), 0);
}

function getGroupedAmount(
  grouped: Array<{ type: EntryType; _sum: { amount: Prisma.Decimal | null } }>,
  type: EntryType,
) {
  return amount(grouped.find((item) => item.type === type)?._sum.amount);
}

function getPercentage(total: number, base: number) {
  return base > 0 ? (total / base) * 100 : 0;
}

function sortByTotalDesc<T extends { total: number; count: number }>(rows: T[]) {
  return rows.sort((a, b) => b.total - a.total || b.count - a.count);
}

function buildRanking(
  entries: ReportEntryPayload[],
  getKey: (entry: ReportEntryPayload) => string,
  getLabel: (entry: ReportEntryPayload) => string,
  totalExpense: number,
) {
  const grouped = new Map<string, ReportRankingRow>();

  for (const entry of entries) {
    if (entry.type !== EntryType.EXPENSE) {
      continue;
    }

    const key = getKey(entry);
    const current = grouped.get(key) ?? {
      id: key,
      label: getLabel(entry),
      total: 0,
      percentage: 0,
      count: 0,
    };

    current.total += amount(entry.amount);
    current.count += 1;
    grouped.set(key, current);
  }

  return sortByTotalDesc(
    Array.from(grouped.values()).map((row) => ({
      ...row,
      percentage: getPercentage(row.total, totalExpense),
    })),
  ).slice(0, 10);
}

function buildPaymentMethods(entries: ReportEntryPayload[], totalExpense: number): ReportPaymentMethodRow[] {
  const grouped = new Map<PaymentMethod, ReportPaymentMethodRow>();

  for (const paymentMethod of Object.values(PaymentMethod)) {
    grouped.set(paymentMethod, {
      paymentMethod,
      label: getPaymentMethodLabel(paymentMethod),
      total: 0,
      percentage: 0,
      count: 0,
    });
  }

  for (const entry of entries) {
    if (entry.type !== EntryType.EXPENSE) {
      continue;
    }

    const current = grouped.get(entry.paymentMethod);

    if (!current) {
      continue;
    }

    current.total += amount(entry.amount);
    current.count += 1;
  }

  return sortByTotalDesc(
    Array.from(grouped.values()).map((row) => ({
      ...row,
      percentage: getPercentage(row.total, totalExpense),
    })),
  );
}

function buildAccounts(entries: ReportEntryPayload[]): ReportAccountRow[] {
  const grouped = new Map<string, ReportAccountRow>();

  for (const entry of entries) {
    const current = grouped.get(entry.account.id) ?? {
      id: entry.account.id,
      label: entry.account.name,
      total: 0,
      installmentTotal: 0,
      count: 0,
    };

    current.total += amount(entry.amount);
    current.count += 1;

    if (entry.isInstallment) {
      current.installmentTotal += amount(entry.amount);
    }

    grouped.set(entry.account.id, current);
  }

  return sortByTotalDesc(Array.from(grouped.values())).slice(0, 10);
}

function buildInstallments(entries: ReportEntryPayload[]) {
  const installmentEntries = entries.filter((entry) => entry.installment);
  const grouped = new Map<string, ReportInstallmentPurchaseRow>();
  let settledCount = 0;
  let pendingCount = 0;
  let settledAmount = 0;
  let pendingAmount = 0;

  for (const entry of installmentEntries) {
    const installment = entry.installment;

    if (!installment) {
      continue;
    }

    const entryAmount = amount(installment.amount);
    const isSettled = installment.status === InstallmentStatus.SETTLED;
    const purchase = installment.installmentPurchase;
    const current = grouped.get(purchase.id) ?? {
      id: purchase.id,
      description: purchase.description,
      accountName: purchase.account.name,
      categoryName: purchase.category.name,
      installmentCount: purchase.installmentCount,
      installmentsInPeriod: 0,
      amountInPeriod: 0,
      settledAmount: 0,
      pendingAmount: 0,
    };

    current.installmentsInPeriod += 1;
    current.amountInPeriod += entryAmount;

    if (isSettled) {
      settledCount += 1;
      settledAmount += entryAmount;
      current.settledAmount += entryAmount;
    } else {
      pendingCount += 1;
      pendingAmount += entryAmount;
      current.pendingAmount += entryAmount;
    }

    grouped.set(purchase.id, current);
  }

  return {
    totalAmount: settledAmount + pendingAmount,
    settledCount,
    pendingCount,
    settledAmount,
    pendingAmount,
    purchases: Array.from(grouped.values())
      .sort((a, b) => b.amountInPeriod - a.amountInPeriod)
      .slice(0, 10),
  };
}

function getBucketKey(date: Date, granularity: "day" | "month") {
  if (granularity === "day") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getBucketLabel(date: Date, granularity: "day" | "month") {
  return new Intl.DateTimeFormat("pt-BR", {
    day: granularity === "day" ? "2-digit" : undefined,
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

function addBucket(date: Date, granularity: "day" | "month") {
  return granularity === "day"
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    : new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function buildEvolution(
  entries: ReportEntryPayload[],
  initialBalance: number,
  startDate: Date,
  endDate: Date,
  granularity: "day" | "month",
): ReportEvolutionPoint[] {
  const grouped = new Map<string, { income: number; expense: number; saved: number; date: Date }>();

  for (let cursor = new Date(startDate); cursor < endDate; cursor = addBucket(cursor, granularity)) {
    grouped.set(getBucketKey(cursor, granularity), {
      income: 0,
      expense: 0,
      saved: 0,
      date: new Date(cursor),
    });
  }

  for (const entry of entries) {
    const key = getBucketKey(entry.competenceDate, granularity);
    const current = grouped.get(key);

    if (!current) {
      continue;
    }

    if (entry.type === EntryType.INCOME) {
      current.income += amount(entry.amount);
    } else if (entry.type === EntryType.EXPENSE) {
      current.expense += amount(entry.amount);
    } else if (entry.type === EntryType.SAVED) {
      current.saved += amount(entry.amount);
    }
  }

  let balance = initialBalance;

  return Array.from(grouped.values()).map((bucket) => {
    balance += bucket.income - bucket.expense - bucket.saved;

    return {
      key: getBucketKey(bucket.date, granularity),
      label: getBucketLabel(bucket.date, granularity),
      income: bucket.income,
      expense: bucket.expense,
      balance,
    };
  });
}

function buildUserBreakdown(entries: ReportEntryPayload[]): ReportUserBreakdownRow[] {
  const grouped = new Map<string, ReportUserBreakdownRow>();

  for (const entry of entries) {
    const current = grouped.get(entry.user.id) ?? {
      userId: entry.user.id,
      userName: entry.user.name,
      userEmail: entry.user.email,
      income: 0,
      expense: 0,
      saved: 0,
      netResult: 0,
      entryCount: 0,
    };

    if (entry.type === EntryType.INCOME) {
      current.income += amount(entry.amount);
    } else if (entry.type === EntryType.EXPENSE) {
      current.expense += amount(entry.amount);
    } else if (entry.type === EntryType.SAVED) {
      current.saved += amount(entry.amount);
    }

    current.netResult = current.income - current.expense - current.saved;
    current.entryCount += 1;
    grouped.set(entry.user.id, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.entryCount - a.entryCount);
}

function buildEntryRows(entries: ReportEntryPayload[]): ReportEntryRow[] {
  return entries.map((entry) => ({
    id: entry.id,
    userName: entry.user.name,
    userEmail: entry.user.email,
    description: entry.description,
    type: entry.type,
    amount: amount(entry.amount),
    competenceDate: entry.competenceDate,
    eventDate: entry.eventDate,
    personName: entry.person.name,
    accountName: entry.account.name,
    categoryName: entry.category?.name ?? "Sem categoria",
    paymentMethodLabel: getPaymentMethodLabel(entry.paymentMethod),
  }));
}

export async function getFinancialReport(query: ReportQueryParams): Promise<FinancialReport> {
  const currentUser = await requireCurrentUser();
  const period = getReportPeriod(query);
  const availableUsers: ReportUserOption[] =
    currentUser.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true },
        })
      : [];
  const reportUser = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  };
  const scope = resolveReportScope(query, reportUser, availableUsers);
  const scopeWhere = scope.userIdFilter ? { userId: { in: scope.userIdFilter } } : {};
  const baseWhere = {
    ...scopeWhere,
    deletedAt: null,
  } satisfies Prisma.FinancialEntryWhereInput;

  const [entries, previousGrouped] = await Promise.all([
    prisma.financialEntry.findMany({
      where: {
        ...baseWhere,
        competenceDate: {
          gte: period.startDate,
          lt: period.endDate,
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        person: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, color: true } },
        installment: {
          include: {
            installmentPurchase: {
              select: {
                id: true,
                description: true,
                totalAmount: true,
                installmentCount: true,
                account: { select: { name: true } },
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ competenceDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.financialEntry.groupBy({
      by: ["type"],
      where: {
        ...baseWhere,
        competenceDate: {
          lt: period.startDate,
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const initialBalance =
    getGroupedAmount(previousGrouped, EntryType.INCOME) -
    getGroupedAmount(previousGrouped, EntryType.EXPENSE) -
    getGroupedAmount(previousGrouped, EntryType.SAVED);
  const income = sumEntries(entries, EntryType.INCOME);
  const expense = sumEntries(entries, EntryType.EXPENSE);
  const saved = sumEntries(entries, EntryType.SAVED);
  const netResult = income - expense - saved;
  const installments = buildInstallments(entries);
  const categoryRanking = buildRanking(
    entries,
    (entry) => entry.category?.id ?? "sem-categoria",
    (entry) => entry.category?.name ?? "Sem categoria",
    expense,
  );
  const personRanking = buildRanking(entries, (entry) => entry.person.id, (entry) => entry.person.name, expense);
  const paymentMethods = buildPaymentMethods(entries, expense);
  const accounts = buildAccounts(entries);

  return {
    generatedAt: new Date(),
    period,
    scope,
    currentUser: reportUser,
    availableUsers,
    summary: {
      initialBalance,
      finalBalance: initialBalance + netResult,
      income,
      expense,
      saved,
      netResult,
      installmentsTotal: installments.settledCount + installments.pendingCount,
      installmentsSettled: installments.settledCount,
      installmentsPending: installments.pendingCount,
      entryCount: entries.length,
      topCategoryName: categoryRanking[0]?.label ?? null,
      topPersonName: personRanking[0]?.label ?? null,
    },
    categoryRanking,
    personRanking,
    paymentMethods,
    accounts,
    installments,
    evolution: buildEvolution(entries, initialBalance, period.startDate, period.endDate, period.granularity),
    userBreakdown: scope.type === "all" ? buildUserBreakdown(entries) : [],
    entries: buildEntryRows(entries),
  };
}
