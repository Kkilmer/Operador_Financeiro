"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { errorResult, logServerError } from "@/lib/actions/action-result";
import { hashPassword } from "@/lib/auth/password";
import { hashPasswordResetToken } from "@/lib/auth/reset-password";
import { createUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Link inválido."),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme sua senha."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "As senhas não coincidem.",
      });
    }
  });

export async function completePasswordResetAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return errorResult("Confira os dados e tente novamente.", "AUTH_RESET_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: {
        gt: new Date(),
      },
      isActive: true,
    },
  });

  if (!user) {
    return errorResult(
      "Esse link de redefinição é inválido ou expirou. Solicite um novo link ao administrador.",
      "AUTH_RESET_TOKEN_INVALID",
    );
  }

  try {
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        mustChangePassword: false,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
        resetPasswordAttempts: 0,
        resetPasswordBlockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await createUserSession(user.id);
  } catch (error) {
    logServerError("auth.complete-password-reset", error, { userId: user.id });
    return errorResult(
      "Não conseguimos atualizar sua senha agora. Tente novamente ou solicite ajuda ao suporte.",
      "AUTH_RESET_FAILED",
    );
  }

  redirect("/dashboard?status=password-updated");
}
