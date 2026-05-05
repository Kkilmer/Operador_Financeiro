"use server";

import { revalidatePath } from "next/cache";
import { PaymentMethodBehavior } from "@prisma/client";

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

export async function updatePaymentMethodAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireCurrentUserId();

  const payload = {
    id: formData.get("id"),
    name: formData.get("name"),
    behavior: formData.get("behavior"),
    paymentMethod: formData.get("paymentMethod"),
    requiresInstallments: formData.get("requiresInstallments") === "on",
    immediateSettlement: formData.get("immediateSettlement") === "on",
    isActive: formData.get("isActive") === "on",
  };

  const parsed = paymentMethodSettingsSchema.safeParse(payload);

  if (!parsed.success || !parsed.data.id) {
    return {
      success: false,
      message: "Revise os campos da forma de pagamento.",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  const duplicate = await prisma.paymentMethodOption.findFirst({
    where: {
      userId,
      id: { not: parsed.data.id },
      OR: [
        { name: parsed.data.name },
        { paymentMethod: parsed.data.paymentMethod },
      ],
    },
  });

  if (duplicate) {
    return {
      success: false,
      message: "Já existe outra forma de pagamento com esse nome ou comportamento interno.",
    };
  }

  const defaults = normalizePaymentMethodDefaults(parsed.data.behavior);

  const updated = await prisma.paymentMethodOption.updateMany({
    where: { id: parsed.data.id, userId },
    data: {
      name: parsed.data.name,
      behavior: parsed.data.behavior,
      paymentMethod: parsed.data.paymentMethod,
      requiresInstallments: defaults.requiresInstallments || parsed.data.requiresInstallments,
      immediateSettlement: defaults.immediateSettlement || parsed.data.immediateSettlement,
      isActive: parsed.data.isActive,
    },
  });

  if (updated.count === 0) {
    return {
      success: false,
      message: "Você não tem permissão para editar essa forma de pagamento.",
    };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");

  return {
    success: true,
    message: "Forma de pagamento atualizada com sucesso.",
  };
}
