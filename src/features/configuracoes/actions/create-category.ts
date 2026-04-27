"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma/client";
import { categorySettingsSchema } from "@/features/configuracoes/schemas/category-settings-schema";
import { SettingsFormState } from "@/features/configuracoes/types/settings-action.types";

export async function createCategoryAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const payload = {
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    isActive: formData.get("isActive") === "on",
  };

  const parsed = categorySettingsSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os campos da categoria.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      name: parsed.data.name,
      type: parsed.data.type,
      parentCategoryId: null,
    },
  });

  if (duplicate) {
    return {
      success: false,
      message: "Ja existe uma categoria com esse nome e tipo.",
    };
  }

  await prisma.category.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      color: parsed.data.color || null,
      icon: parsed.data.icon || null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/configuracoes");
  revalidatePath("/lancamentos/novo");

  return {
    success: true,
    message: "Categoria criada com sucesso.",
  };
}
