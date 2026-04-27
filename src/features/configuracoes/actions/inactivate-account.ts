"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";

export async function inactivateAccountAction(accountId: string) {
  await prisma.financialAccount.update({
    where: { id: accountId },
    data: { isActive: false },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");
}

