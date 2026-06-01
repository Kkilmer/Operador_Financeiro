"use server";

import { revalidatePath } from "next/cache";

import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function inactivatePaymentMethodAction(id: string) {
  const userId = await requireCurrentUserId();

  try {
    const updated = await prisma.paymentMethodOption.updateMany({
      where: { id, userId },
      data: { isActive: false },
    });

    if (updated.count === 0) {
      return errorResult(
        "Você não tem permissão para inativar essa forma de pagamento.",
        "SETTINGS_PAYMENT_METHOD_FORBIDDEN",
      );
    }
  } catch (error) {
    logServerError("settings.inactivate-payment-method", error, { userId, paymentMethodId: id });
    return errorResult(
      "Não conseguimos inativar essa forma de pagamento agora. Tente novamente ou use o suporte.",
      "SETTINGS_PAYMENT_METHOD_INACTIVATE_FAILED",
    );
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");

  return successResult("Forma de pagamento inativada com sucesso.");
}
