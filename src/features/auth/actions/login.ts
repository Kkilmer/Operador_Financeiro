"use server";

import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { AuthFormState } from "@/features/auth/types/auth-form-state";
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
    return {
      success: false,
      message: "Confira os dados e tente novamente.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    return {
      success: false,
      message: "E-mail ou senha inválidos.",
    };
  }

  const passwordIsValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!passwordIsValid) {
    return {
      success: false,
      message: "E-mail ou senha inválidos.",
    };
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
    return {
      success: false,
      message: "Sua senha foi resetada. Use o link de redefinição enviado pelo administrador.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  await createUserSession(user.id);

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
    return {
      success: false,
      message: "Confira os dados e tente novamente.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const cpf = normalizeCpf(parsed.data.cpf);
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      message: "Já existe uma conta com esse e-mail.",
    };
  }

  const existingCpf = await prisma.user.findUnique({
    where: { cpf },
  });

  if (existingCpf) {
    return {
      success: false,
      message: "Já existe uma conta com esse CPF.",
    };
  }

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

  redirect("/dashboard?status=registered");
}
