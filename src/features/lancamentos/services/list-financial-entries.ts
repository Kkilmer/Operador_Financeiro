import { ensureFixedEntriesForMonth } from "@/lib/application/financial-entry/ensure-fixed-entries-for-month";
import { prisma } from "@/lib/prisma/client";

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

export async function listFinancialEntries(referenceMonth?: string) {
  const { start, end } = getMonthRange(referenceMonth);

  await ensureFixedEntriesForMonth(referenceMonth);

  return prisma.financialEntry.findMany({
    where: {
      competenceDate: {
        gte: start,
        lt: end,
      },
    },
    include: {
      person: true,
      account: true,
      category: true,
      installment: true,
    },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });
}
