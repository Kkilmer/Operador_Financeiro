"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";

export async function inactivateCategoryAction(id: string) {
  await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");
}
