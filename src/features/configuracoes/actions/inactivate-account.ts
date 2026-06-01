"use server";

import { revalidatePath } from "next/cache";

import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function inactivateAccountAction(accountId: string) {
  const userId = await requireCurrentUserId();

  try {
    const updated = await prisma.financialAccount.updateMany({
      where: { id: accountId, userId },
      data: { isActive: false },
    });

    if (updated.count === 0) {
      return errorResult("Você não tem permissão para inativar essa conta ou cartão.", "SETTINGS_ACCOUNT_FORBIDDEN");
    }
  } catch (error) {
    logServerError("settings.inactivate-account", error, { userId, accountId });
    return errorResult(
      "Não conseguimos inativar essa conta ou cartão agora. Tente novamente ou use o suporte.",
      "SETTINGS_ACCOUNT_INACTIVATE_FAILED",
    );
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");

  return successResult("Conta ou cartão inativado com sucesso.");
}
