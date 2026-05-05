"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { hashPassword } from "@/lib/auth/password";
import { hashPasswordResetToken } from "@/lib/auth/reset-password";
import { createUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Link inválido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme sua senha."),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "As senhas precisam ser iguais.",
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
    return {
      success: false,
      message: "Confira os dados e tente novamente.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
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
    return {
      success: false,
      message: "Esse link de redefinição é inválido ou expirou.",
    };
  }

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
      lastLoginAt: new Date(),
    },
  });

  await createUserSession(user.id);

  redirect("/dashboard");
}
