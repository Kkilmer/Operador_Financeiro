"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";

export async function inactivatePaymentMethodAction(id: string) {
  await prisma.paymentMethodOption.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");
}
