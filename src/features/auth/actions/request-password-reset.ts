"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { isValidCpf, normalizeCpf } from "@/lib/auth/cpf";
import { createPasswordResetToken } from "@/lib/auth/reset-password";
import { prisma } from "@/lib/prisma/client";

const FORGOT_PASSWORD_ERROR_MESSAGE = "Nao foi possivel validar seus dados.";
const RESET_TOKEN_TTL_IN_MINUTES = 15;

const forgotPasswordSchema = z.object({
  cpf: z.string().trim().min(1, "Digite seu CPF."),
});

export async function requestPasswordResetAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    cpf: formData.get("cpf"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Confira os dados e tente novamente.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isValidCpf(parsed.data.cpf)) {
    return {
      success: false,
      message: "Confira os dados e tente novamente.",
      fieldErrors: {
        cpf: ["Digite um CPF valido."],
      },
    };
  }

  const cpf = normalizeCpf(parsed.data.cpf);
  const user = await prisma.user.findUnique({
    where: { cpf },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return {
      success: false,
      message: FORGOT_PASSWORD_ERROR_MESSAGE,
    };
  }

  const { rawToken, tokenHash } = createPasswordResetToken();
  const resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_IN_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt,
    },
  });

  redirect(`/redefinir-senha?token=${rawToken}`);
}
