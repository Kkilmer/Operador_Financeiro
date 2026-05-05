"use server";

import { SupportTicketType } from "@prisma/client";
import { z } from "zod";

import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export type SupportTicketFormState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const createSupportTicketSchema = z.object({
  type: z.nativeEnum(SupportTicketType, {
    invalid_type_error: "Selecione o tipo da solicitacao.",
    required_error: "Selecione o tipo da solicitacao.",
  }),
  description: z
    .string()
    .trim()
    .min(10, "Descreva com um pouco mais de detalhe.")
    .max(2000, "Sua solicitacao precisa ter no maximo 2000 caracteres."),
});

export async function createSupportTicketAction(
  _prevState: SupportTicketFormState,
  formData: FormData,
): Promise<SupportTicketFormState> {
  const userId = await requireCurrentUserId();
  const parsed = createSupportTicketSchema.safeParse({
    type: formData.get("type"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Confira os dados e tente novamente.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.supportTicket.create({
    data: {
      userId,
      type: parsed.data.type,
      description: parsed.data.description,
    },
  });

  return {
    success: true,
    message: "Solicitacao enviada para o admin.",
  };
}
