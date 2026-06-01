"use server";

import { z } from "zod";

import { createPasswordResetToken } from "@/lib/auth/reset-password";
import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { getPublicAppUrl } from "@/lib/runtime/app-url";

export type ResetUserPasswordState = {
  success: boolean;
  message?: string;
  errorCode?: string;
  resetUrl?: string;
};

const resetUserPasswordSchema = z.object({
  userId: z.string().trim().min(1),
});

export async function resetUserPasswordAction(
  _prevState: ResetUserPasswordState,
  formData: FormData,
): Promise<ResetUserPasswordState> {
  await requireAdminUser();

  const parsed = resetUserPasswordSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return errorResult("Não foi possível gerar o link de redefinição.", "ADMIN_RESET_PASSWORD_VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      email: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return errorResult("Usuário inativo não pode receber redefinição de senha.", "ADMIN_RESET_PASSWORD_INACTIVE_USER");
  }

  const { rawToken, tokenHash } = createPasswordResetToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  const resetUrl = `${getPublicAppUrl()}/redefinir-senha?token=${rawToken}`;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mustChangePassword: true,
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: expiresAt,
        resetPasswordAttempts: 0,
        resetPasswordBlockedUntil: null,
      },
    });

    await prisma.session.deleteMany({
      where: { userId: user.id },
    });
  } catch (error) {
    logServerError("admin.reset-user-password", error, { userId: user.id });
    return errorResult(
      "Não conseguimos gerar o link de redefinição agora. Tente novamente ou use o suporte se o problema continuar.",
      "ADMIN_RESET_PASSWORD_FAILED",
    );
  }

  return successResult(`Link de redefinição gerado para ${user.email}. Ele expira em 30 minutos.`, {
    resetUrl,
  });
}
