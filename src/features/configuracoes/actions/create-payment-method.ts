"use server";

import { revalidatePath } from "next/cache";
import { PaymentMethodBehavior } from "@prisma/client";

import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { paymentMethodSettingsSchema } from "@/features/configuracoes/schemas/payment-method-settings-schema";
import { SettingsFormState } from "@/features/configuracoes/types/settings-action.types";

function normalizePaymentMethodDefaults(behavior: PaymentMethodBehavior) {
  return {
    immediateSettlement:
      behavior === PaymentMethodBehavior.PIX ||
      behavior === PaymentMethodBehavior.DEBITO ||
      behavior === PaymentMethodBehavior.DINHEIRO ||
      behavior === PaymentMethodBehavior.TRANSFERENCIA,
    requiresInstallments: behavior === PaymentMethodBehavior.CREDITO_PARCELADO,
  };
}

export async function createPaymentMethodAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireCurrentUserId();

  const payload = {
    name: formData.get("name"),
    behavior: formData.get("behavior"),
    paymentMethod: formData.get("paymentMethod"),
    requiresInstallments: formData.get("requiresInstallments") === "on",
    immediateSettlement: formData.get("immediateSettlement") === "on",
    isActive: formData.get("isActive") === "on",
  };

  const parsed = paymentMethodSettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResult(
      "Revise os campos da forma de pagamento.",
      "SETTINGS_PAYMENT_METHOD_CREATE_VALIDATION_ERROR",
      {
      fieldErrors: parsed.error.flatten().fieldErrors,
      },
    );
  }

  const duplicate = await prisma.paymentMethodOption.findFirst({
    where: {
      userId,
      OR: [
        { name: parsed.data.name },
        { paymentMethod: parsed.data.paymentMethod },
      ],
    },
  });

  if (duplicate) {
    return errorResult(
      "Já existe uma forma de pagamento com esse nome ou comportamento interno.",
      "SETTINGS_PAYMENT_METHOD_DUPLICATE",
    );
  }

  const defaults = normalizePaymentMethodDefaults(parsed.data.behavior);

  try {
    await prisma.paymentMethodOption.create({
      data: {
        userId,
        name: parsed.data.name,
        behavior: parsed.data.behavior,
        paymentMethod: parsed.data.paymentMethod,
        requiresInstallments: defaults.requiresInstallments || parsed.data.requiresInstallments,
        immediateSettlement: defaults.immediateSettlement || parsed.data.immediateSettlement,
        isActive: parsed.data.isActive,
      },
    });
  } catch (error) {
    logServerError("settings.create-payment-method", error, { userId, name: parsed.data.name });
    return errorResult(
      "Não conseguimos criar a forma de pagamento agora. Tente novamente ou use o suporte.",
      "SETTINGS_PAYMENT_METHOD_CREATE_FAILED",
    );
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos/novo");

  return successResult("Forma de pagamento criada com sucesso.");
}
