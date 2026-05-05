"use server";

import { z } from "zod";

import { isValidCpf, normalizeCpf } from "@/lib/auth/cpf";
import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export type UpdateUserProfileState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const updateUserProfileSchema = z.object({
  userId: z.string().trim().min(1, "Usuário inválido."),
  name: z.string().trim().min(2, "Digite o nome do usuário."),
  email: z.string().trim().email("Digite um e-mail válido."),
  cpf: z.string().trim().min(1, "Digite o CPF do usuário."),
});

export async function updateUserProfileAction(
  _prevState: UpdateUserProfileState,
  formData: FormData,
): Promise<UpdateUserProfileState> {
  await requireAdminUser();

  const parsed = updateUserProfileSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
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
        cpf: ["Digite um CPF válido."],
      },
    };
  }

  const email = parsed.data.email.toLowerCase();
  const cpf = normalizeCpf(parsed.data.cpf);

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });

  if (!targetUser) {
    return {
      success: false,
      message: "Usuário não encontrado.",
    };
  }

  const existingEmail = await prisma.user.findFirst({
    where: {
      email,
      id: {
        not: parsed.data.userId,
      },
    },
    select: { id: true },
  });

  if (existingEmail) {
    return {
      success: false,
      message: "Já existe uma conta com esse e-mail.",
      fieldErrors: {
        email: ["Esse e-mail já está em uso."],
      },
    };
  }

  const existingCpf = await prisma.user.findFirst({
    where: {
      cpf,
      id: {
        not: parsed.data.userId,
      },
    },
    select: { id: true },
  });

  if (existingCpf) {
    return {
      success: false,
      message: "Já existe uma conta com esse CPF.",
      fieldErrors: {
        cpf: ["Esse CPF já está em uso."],
      },
    };
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: {
      name: parsed.data.name,
      email,
      cpf,
    },
  });

  return {
    success: true,
    message: "Usuário atualizado com sucesso.",
  };
}
