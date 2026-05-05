"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function inactivateAccountAction(accountId: string) {
  const userId = await requireCurrentUserId();

  await prisma.financialAccount.updateMany({
    where: { id: accountId, userId },
    data: { isActive: false },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");
}
