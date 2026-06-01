"use server";

import { revalidatePath } from "next/cache";

import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { categorySettingsSchema } from "@/features/configuracoes/schemas/category-settings-schema";
import { SettingsFormState } from "@/features/configuracoes/types/settings-action.types";

export async function createCategoryAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const userId = await requireCurrentUserId();

  const payload = {
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    isActive: formData.get("isActive") === "on",
  };

  const parsed = categorySettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResult("Revise os campos da categoria.", "SETTINGS_CATEGORY_CREATE_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      name: parsed.data.name,
      type: parsed.data.type,
      parentCategoryId: null,
    },
  });

  if (duplicate) {
    return errorResult("Já existe uma categoria com esse nome e tipo.", "SETTINGS_CATEGORY_DUPLICATE");
  }

  try {
    await prisma.category.create({
      data: {
        userId,
        name: parsed.data.name,
        type: parsed.data.type,
        color: parsed.data.color || null,
        icon: parsed.data.icon || null,
        isActive: parsed.data.isActive,
      },
    });
  } catch (error) {
    logServerError("settings.create-category", error, { userId, name: parsed.data.name });
    return errorResult(
      "Não conseguimos criar a categoria agora. Tente novamente ou use o suporte se o problema continuar.",
      "SETTINGS_CATEGORY_CREATE_FAILED",
    );
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos/novo");

  return successResult("Categoria criada com sucesso.");
}
