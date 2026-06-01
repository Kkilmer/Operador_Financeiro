"use server";

import { revalidatePath } from "next/cache";

import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { categorySettingsSchema } from "@/features/configuracoes/schemas/category-settings-schema";
import { SettingsFormState } from "@/features/configuracoes/types/settings-action.types";

export async function updateCategoryAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireCurrentUserId();

  const payload = {
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    isActive: formData.get("isActive") === "on",
  };

  const parsed = categorySettingsSchema.safeParse(payload);

  if (!parsed.success || !parsed.data.id) {
    return errorResult("Revise os campos da categoria.", "SETTINGS_CATEGORY_UPDATE_VALIDATION_ERROR", {
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    });
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      id: { not: parsed.data.id },
      name: parsed.data.name,
      type: parsed.data.type,
      parentCategoryId: null,
    },
  });

  if (duplicate) {
    return errorResult("Já existe outra categoria com esse nome e tipo.", "SETTINGS_CATEGORY_DUPLICATE");
  }

  let updated;

  try {
    updated = await prisma.category.updateMany({
      where: { id: parsed.data.id, userId },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        color: parsed.data.color || null,
        icon: parsed.data.icon || null,
        isActive: parsed.data.isActive,
      },
    });
  } catch (error) {
    logServerError("settings.update-category", error, { userId, categoryId: parsed.data.id });
    return errorResult(
      "Não conseguimos atualizar a categoria agora. Tente novamente ou use o suporte.",
      "SETTINGS_CATEGORY_UPDATE_FAILED",
    );
  }

  if (updated.count === 0) {
    return errorResult("Você não tem permissão para editar essa categoria.", "SETTINGS_CATEGORY_FORBIDDEN");
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");

  return successResult("Categoria atualizada com sucesso.");
}
