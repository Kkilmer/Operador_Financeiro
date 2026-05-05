import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function listPaymentMethodOptions() {
  const userId = await requireCurrentUserId();

  return prisma.paymentMethodOption.findMany({
    where: {
      userId,
    },
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
