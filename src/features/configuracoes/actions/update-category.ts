"use server";

import { revalidatePath } from "next/cache";

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
    return {
      success: false,
      message: "Revise os campos da categoria.",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
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
    return {
      success: false,
      message: "Já existe outra categoria com esse nome e tipo.",
    };
  }

  const updated = await prisma.category.updateMany({
    where: { id: parsed.data.id, userId },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      color: parsed.data.color || null,
      icon: parsed.data.icon || null,
      isActive: parsed.data.isActive,
    },
  });

  if (updated.count === 0) {
    return {
      success: false,
      message: "Você não tem permissão para editar essa categoria.",
    };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos");
  revalidatePath("/lancamentos/novo");

  return {
    success: true,
    message: "Categoria atualizada com sucesso.",
  };
}
