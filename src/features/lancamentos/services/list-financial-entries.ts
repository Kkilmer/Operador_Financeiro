import { ensureFixedEntriesForMonth } from "@/lib/application/financial-entry/ensure-fixed-entries-for-month";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { EntryFrequencyProfile, EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";

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

function getMonthRange(referenceMonth?: string) {
  const start = getReferenceMonthDate(referenceMonth);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  return { start, end };
}

export type FinancialEntryListFilters = {
  settlementStatus?: SettlementStatus;
  type?: EntryType;
  recurrence?: EntryFrequencyProfile;
  isInstallment?: boolean;
  accountId?: string;
  paymentMethod?: PaymentMethod;
  categoryId?: string;
  personId?: string;
};

export async function listFinancialEntries(
  referenceMonth?: string,
  filters: FinancialEntryListFilters = {},
) {
  const userId = await requireCurrentUserId();
  const { start, end } = getMonthRange(referenceMonth);

  await ensureFixedEntriesForMonth(referenceMonth);

  return prisma.financialEntry.findMany({
    where: {
      userId,
      deletedAt: null,
      competenceDate: {
        gte: start,
        lt: end,
      },
      ...(filters.settlementStatus ? { settlementStatus: filters.settlementStatus } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.recurrence ? { frequencyProfile: filters.recurrence } : {}),
      ...(typeof filters.isInstallment === "boolean" ? { isInstallment: filters.isInstallment } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.personId ? { personId: filters.personId } : {}),
    },
    include: {
      person: true,
      account: true,
      category: true,
      installment: {
        include: {
          installmentPurchase: {
            select: {
              installmentCount: true,
            },
          },
        },
      },
    },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });
}
