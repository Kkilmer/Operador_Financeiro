import { EntryType, Prisma, SettlementStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

type InstallmentStatusFilter = "all" | "pending" | "paid";

export type InstallmentCommitmentFilters = {
  month?: string;
  personId?: string;
  status?: InstallmentStatusFilter;
};

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

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export async function listInstallmentCommitments(filters: InstallmentCommitmentFilters = {}) {
  const { start, end } = getMonthBounds(filters.month);

  const financialEntryWhere: Prisma.FinancialEntryWhereInput = {
    type: EntryType.EXPENSE,
    isInstallment: true,
  };

  if (filters.personId) {
    financialEntryWhere.personId = filters.personId;
  }

  if (filters.status === "pending") {
    financialEntryWhere.settlementStatus = SettlementStatus.PENDING;
  } else if (filters.status === "paid") {
    financialEntryWhere.settlementStatus = SettlementStatus.SETTLED;
  }

  const installments = await prisma.installment.findMany({
    where: {
      competenceDate: {
        gte: start,
        lt: end,
      },
      financialEntry: financialEntryWhere,
    },
    include: {
      installmentPurchase: {
        include: {
          person: {
            select: {
              id: true,
              name: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      financialEntry: {
        select: {
          id: true,
          description: true,
          amount: true,
          settlementStatus: true,
          notes: true,
          eventDate: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          account: {
            select: {
              id: true,
              name: true,
            },
          },
          person: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { number: "asc" }],
  });

  const items = installments.map((installment) => {
    const isPaid = installment.financialEntry.settlementStatus === SettlementStatus.SETTLED;
    const amount = Number(installment.amount);

    return {
      id: installment.id,
      financialEntryId: installment.financialEntryId,
      description: installment.financialEntry.description || installment.installmentPurchase.description,
      personId: installment.installmentPurchase.person.id,
      personName: installment.installmentPurchase.person.name,
      accountName: installment.installmentPurchase.account.name,
      categoryName:
        installment.financialEntry.category?.name ??
        installment.installmentPurchase.category.name ??
        "Sem categoria",
      installmentLabel: `${installment.number}/${installment.installmentPurchase.installmentCount}`,
      amount,
      status: isPaid ? "paid" : "pending",
      statusLabel: isPaid ? "Pago" : "Pendente",
      dueDateLabel: formatDateLabel(installment.dueDate),
      notes: installment.financialEntry.notes ?? null,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = items.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
  const totalPending = items
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    referenceMonth: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
    filters: {
      month: filters.month ?? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      personId: filters.personId ?? "",
      status: filters.status ?? "all",
    },
    items,
    summary: {
      totalAmount,
      totalPaid,
      totalPending,
      paidCount: items.filter((item) => item.status === "paid").length,
      pendingCount: items.filter((item) => item.status === "pending").length,
    },
  };
}
