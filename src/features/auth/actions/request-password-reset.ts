"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { isValidCpf, normalizeCpf } from "@/lib/auth/cpf";
import { canSendPasswordResetMail, sendPasswordResetMail } from "@/lib/auth/password-reset-mail";
import { createPasswordResetToken } from "@/lib/auth/reset-password";
import { prisma } from "@/lib/prisma/client";

const FORGOT_PASSWORD_SUCCESS_MESSAGE = "Se os dados estiverem corretos, enviaremos as instruções de redefinição.";
const RESET_TOKEN_TTL_IN_MINUTES = 30;
const RESET_PASSWORD_MAX_ATTEMPTS = 5;
const RESET_PASSWORD_BLOCK_HOURS = 5;

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Digite um e-mail válido."),
  cpf: z.string().trim().min(1, "Digite seu CPF."),
});

export async function requestPasswordResetAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
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

  const email = parsed.data.email.toLowerCase();
  const cpf = normalizeCpf(parsed.data.cpf);
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "unknown";

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      cpf: true,
      isActive: true,
      resetPasswordAttempts: true,
      resetPasswordBlockedUntil: true,
    },
  });

  if (user?.resetPasswordBlockedUntil && user.resetPasswordBlockedUntil > new Date()) {
    console.warn("[auth] password reset temporarily blocked", {
      email,
      ipAddress,
      blockedUntil: user.resetPasswordBlockedUntil.toISOString(),
    });

    return {
      success: true,
      message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
    };
  }

  if (!user || !user.isActive || user.cpf !== cpf) {
    if (user) {
      const nextAttempts = user.resetPasswordAttempts + 1;
      const shouldBlock = nextAttempts >= RESET_PASSWORD_MAX_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordAttempts: shouldBlock ? 0 : nextAttempts,
          resetPasswordBlockedUntil: shouldBlock
            ? new Date(Date.now() + RESET_PASSWORD_BLOCK_HOURS * 60 * 60 * 1000)
            : null,
        },
      });
    }

    console.warn("[auth] password reset validation failed", {
      email,
      cpfSuffix: cpf.slice(-2),
      ipAddress,
      knownEmail: Boolean(user),
      userActive: user?.isActive ?? false,
    });

    return {
      success: true,
      message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
    };
  }

  const matchedUser = user;

  const { rawToken, tokenHash } = createPasswordResetToken();
  const resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_IN_MINUTES * 60 * 1000);
  const resetUrl = `${process.env.APP_URL ?? "http://127.0.0.1:3000"}/redefinir-senha?token=${rawToken}`;

  await prisma.user.update({
    where: { id: matchedUser.id },
    data: {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt,
      resetPasswordAttempts: 0,
      resetPasswordBlockedUntil: null,
    },
  });

  const shouldSendEmail = canSendPasswordResetMail();

  if (shouldSendEmail) {
    try {
      await sendPasswordResetMail({
        email: matchedUser.email,
        resetUrl,
      });
    } catch (error) {
      console.error("[auth] failed to send reset password email", {
        userId: matchedUser.id,
        email: matchedUser.email,
        ipAddress,
        error,
      });
    }
  }

  return {
    success: true,
    message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
    debugResetUrl:
      process.env.NODE_ENV !== "production" && !shouldSendEmail ? resetUrl : undefined,
  };
}
