import { prisma } from "@/lib/prisma/client";
import { getMonthRange } from "@/lib/utils/date";

export async function listFinancialEntries() {
  const { start, end } = getMonthRange();

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
