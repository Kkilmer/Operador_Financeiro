"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function inactivatePaymentMethodAction(id: string) {
  const userId = await requireCurrentUserId();

  await prisma.paymentMethodOption.updateMany({
    where: { id, userId },
    data: { isActive: false },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");
}
