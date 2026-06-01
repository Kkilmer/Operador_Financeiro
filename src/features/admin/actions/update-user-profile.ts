"use server";

import { z } from "zod";

import { isValidCpf, normalizeCpf } from "@/lib/auth/cpf";
import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export type UpdateUserProfileState = {
  success: boolean;
  message?: string;
  errorCode?: string;
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
    return errorResult("Confira os dados e tente novamente.", "ADMIN_UPDATE_USER_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  if (!isValidCpf(parsed.data.cpf)) {
    return errorResult("Confira os dados e tente novamente.", "ADMIN_UPDATE_USER_INVALID_CPF", {
      fieldErrors: {
        cpf: ["Digite um CPF válido."],
      },
    });
  }

  const email = parsed.data.email.toLowerCase();
  const cpf = normalizeCpf(parsed.data.cpf);

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });

  if (!targetUser) {
    return errorResult("Usuário não encontrado.", "ADMIN_USER_NOT_FOUND");
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
    return errorResult("Já existe uma conta com esse e-mail.", "ADMIN_UPDATE_USER_DUPLICATE_EMAIL", {
      fieldErrors: {
        email: ["Esse e-mail já está em uso."],
      },
    });
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
    return errorResult("Já existe uma conta com esse CPF.", "ADMIN_UPDATE_USER_DUPLICATE_CPF", {
      fieldErrors: {
        cpf: ["Esse CPF já está em uso."],
      },
    });
  }

  try {
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email,
        cpf,
      },
    });
  } catch (error) {
    logServerError("admin.update-user-profile", error, { userId: parsed.data.userId });
    return errorResult(
      "Não conseguimos salvar os dados do usuário agora. Tente novamente ou use o suporte.",
      "ADMIN_UPDATE_USER_FAILED",
    );
  }

  return successResult("Usuário atualizado com sucesso.");
}
