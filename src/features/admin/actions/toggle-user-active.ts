"use server";

import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export type AdminUserActionState = {
  success: boolean;
  message?: string;
};

const toggleUserActiveSchema = z.object({
  userId: z.string().trim().min(1),
  nextActive: z.enum(["true", "false"]),
});

export async function toggleUserActiveAction(
  _prevState: AdminUserActionState,
  formData: FormData,
): Promise<AdminUserActionState> {
  const admin = await requireAdminUser();
  const parsed = toggleUserActiveSchema.safeParse({
    userId: formData.get("userId"),
    nextActive: formData.get("nextActive"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Não foi possível atualizar o status desse usuário.",
    };
  }

  if (parsed.data.userId === admin.id && parsed.data.nextActive === "false") {
    return {
      success: false,
      message: "Você não pode desativar seu próprio acesso de administrador.",
    };
  }

  const nextActive = parsed.data.nextActive === "true";

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: {
      isActive: nextActive,
      ...(nextActive
        ? {}
        : {
            resetPasswordTokenHash: null,
            resetPasswordExpiresAt: null,
          }),
    },
  });

  if (!nextActive) {
    await prisma.session.deleteMany({
      where: { userId: parsed.data.userId },
    });
  }

  return {
    success: true,
    message: nextActive ? "Usuário reativado com sucesso." : "Usuário desativado com sucesso.",
  };
}
