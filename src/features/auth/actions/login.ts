"use server";

import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { errorResult, logServerError } from "@/lib/actions/action-result";
import { isValidCpf, normalizeCpf } from "@/lib/auth/cpf";
import { hashPassword, passwordNeedsRehash, verifyPassword } from "@/lib/auth/password";
import { createUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

const loginSchema = z.object({
  email: z.string().trim().email("Digite um e-mail válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return errorResult("Confira os dados e tente novamente.", "AUTH_LOGIN_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    return errorResult("E-mail ou senha inválidos.", "AUTH_LOGIN_INVALID_CREDENTIALS");
  }

  const passwordIsValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!passwordIsValid) {
    return errorResult("E-mail ou senha inválidos.", "AUTH_LOGIN_INVALID_CREDENTIALS");
  }

  if (passwordNeedsRehash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
      },
    });
  }

  if (user.mustChangePassword) {
    return errorResult(
      "Sua senha foi redefinida. Use o link enviado pelo administrador para cadastrar uma nova senha.",
      "AUTH_LOGIN_PASSWORD_RESET_PENDING",
    );
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    await createUserSession(user.id);
  } catch (error) {
    logServerError("auth.login", error, { userId: user.id });
    return errorResult(
      "Não conseguimos concluir seu acesso agora. Tente novamente ou procure o suporte.",
      "AUTH_LOGIN_FAILED",
    );
  }

  redirect("/dashboard");
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Digite seu nome."),
    email: z.string().trim().email("Digite um e-mail válido."),
    cpf: z.string().trim().min(1, "Digite seu CPF."),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme sua senha."),
  })
  .superRefine((data, ctx) => {
    if (!isValidCpf(data.cpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cpf"],
        message: "Digite um CPF válido.",
      });
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "As senhas não coincidem.",
      });
    }
  });

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return errorResult("Confira os dados e tente novamente.", "AUTH_REGISTER_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const email = parsed.data.email.toLowerCase();
  const cpf = normalizeCpf(parsed.data.cpf);
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return errorResult("Já existe uma conta com esse e-mail.", "AUTH_REGISTER_DUPLICATE_EMAIL");
  }

  const existingCpf = await prisma.user.findUnique({
    where: { cpf },
  });

  if (existingCpf) {
    return errorResult("Já existe uma conta com esse CPF.", "AUTH_REGISTER_DUPLICATE_CPF");
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        cpf,
        passwordHash,
        role: UserRole.USER,
        isActive: true,
      },
    });

    await createUserSession(user.id);
  } catch (error) {
    logServerError("auth.register", error, { email });
    return errorResult(
      "Não conseguimos criar sua conta agora. Tente novamente ou procure o suporte se o problema continuar.",
      "AUTH_REGISTER_FAILED",
    );
  }

  redirect("/dashboard?status=registered");
}
