import { prisma } from "@/lib/prisma/client";

export async function listAccounts() {
  return prisma.financialAccount.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      currency: true,
      initialBalance: true,
      creditLimit: true,
      closingDay: true,
      dueDay: true,
      isActive: true,
      institution: {
        select: {
          id: true,
          name: true,
        },
      },
      ownerPerson: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          entries: true,
          purchases: true,
        },
      },
    },
  });
}

