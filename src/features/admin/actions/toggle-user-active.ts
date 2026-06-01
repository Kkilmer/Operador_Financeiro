"use server";

import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/session";
import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { prisma } from "@/lib/prisma/client";

export type AdminUserActionState = {
  success: boolean;
  message?: string;
  errorCode?: string;
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
    return errorResult("Não foi possível atualizar o status desse usuário.", "ADMIN_TOGGLE_USER_VALIDATION_ERROR");
  }

  if (parsed.data.userId === admin.id && parsed.data.nextActive === "false") {
    return {
      ...errorResult(
        "Você não pode desativar seu próprio acesso de administrador.",
        "ADMIN_TOGGLE_SELF_FORBIDDEN",
      ),
      message: "Você não pode desativar seu próprio acesso de administrador.",
    };
  }

  const nextActive = parsed.data.nextActive === "true";

  try {
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
  } catch (error) {
    logServerError("admin.toggle-user-active", error, {
      userId: parsed.data.userId,
      nextActive,
    });
    return errorResult(
      "Não conseguimos atualizar o status desse usuário agora. Tente novamente ou use o suporte.",
      "ADMIN_TOGGLE_USER_FAILED",
    );
  }

  return successResult(nextActive ? "Usuário reativado com sucesso." : "Usuário desativado com sucesso.");
}
