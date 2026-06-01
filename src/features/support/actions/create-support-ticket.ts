"use server";

import { SupportTicketType } from "@prisma/client";
import { z } from "zod";

import { requireCurrentUserId } from "@/lib/auth/session";
import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { prisma } from "@/lib/prisma/client";

export type SupportTicketFormState = {
  success: boolean;
  message?: string;
  errorCode?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const createSupportTicketSchema = z.object({
  type: z.nativeEnum(SupportTicketType, {
    invalid_type_error: "Selecione o tipo da solicitação.",
    required_error: "Selecione o tipo da solicitação.",
  }),
  description: z
    .string()
    .trim()
    .min(10, "Descreva com um pouco mais de detalhe.")
    .max(2000, "Sua solicitação precisa ter no máximo 2000 caracteres."),
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
    return errorResult("Confira os dados e tente novamente.", "SUPPORT_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await prisma.supportTicket.create({
      data: {
        userId,
        type: parsed.data.type,
        description: parsed.data.description,
      },
    });
  } catch (error) {
    logServerError("support.create-ticket", error, { userId, type: parsed.data.type });
    return errorResult(
      "Não conseguimos enviar sua solicitação agora. Tente novamente ou use o menu Suporte se o problema continuar.",
      "SUPPORT_CREATE_FAILED",
    );
  }

  return successResult("Solicitação enviada para o administrador.");
}
