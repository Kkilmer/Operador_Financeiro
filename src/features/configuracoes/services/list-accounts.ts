import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { serializePrisma } from "@/lib/utils/serialize-prisma";

export async function listAccounts() {
  const userId = await requireCurrentUserId();

  const accounts = await prisma.financialAccount.findMany({
    where: {
      userId,
    },
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

  return serializePrisma(accounts);
}
