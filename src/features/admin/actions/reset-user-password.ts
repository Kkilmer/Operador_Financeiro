"use server";

import { z } from "zod";

import { createPasswordResetToken } from "@/lib/auth/reset-password";
import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export type ResetUserPasswordState = {
  success: boolean;
  message?: string;
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
    return {
      success: false,
      message: "Não foi possível gerar o link de redefinição.",
    };
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
    return {
      success: false,
      message: "Usuário inativo não pode receber redefinição de senha.",
    };
  }

  const { rawToken, tokenHash } = createPasswordResetToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  const resetUrl = `${process.env.APP_URL ?? "http://127.0.0.1:3000"}/redefinir-senha?token=${rawToken}`;

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

  return {
    success: true,
    message: `Link de redefinição gerado para ${user.email}. Ele expira em 30 minutos.`,
    resetUrl,
  };
}
