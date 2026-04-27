import { prisma } from "@/lib/prisma/client";

export async function listPaymentMethodOptions() {
  return prisma.paymentMethodOption.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      behavior: true,
      paymentMethod: true,
      requiresInstallments: true,
      immediateSettlement: true,
      isActive: true,
    },
  });
}
