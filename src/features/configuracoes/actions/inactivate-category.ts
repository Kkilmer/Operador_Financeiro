"use server";

import { revalidatePath } from "next/cache";

import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function inactivateCategoryAction(id: string) {
  const userId = await requireCurrentUserId();

  try {
    const updated = await prisma.category.updateMany({
      where: { id, userId },
      data: { isActive: false },
    });

    if (updated.count === 0) {
      return errorResult("Você não tem permissão para inativar essa categoria.", "SETTINGS_CATEGORY_FORBIDDEN");
    }
  } catch (error) {
    logServerError("settings.inactivate-category", error, { userId, categoryId: id });
    return errorResult(
      "Não conseguimos inativar essa categoria agora. Tente novamente ou use o suporte.",
      "SETTINGS_CATEGORY_INACTIVATE_FAILED",
    );
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");

  return successResult("Categoria inativada com sucesso.");
}
