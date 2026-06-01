"use server";

import { SupportTicketStatus } from "@prisma/client";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/session";
import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { prisma } from "@/lib/prisma/client";

export type UpdateSupportTicketState = {
  success: boolean;
  message?: string;
  errorCode?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const updateSupportTicketSchema = z.object({
  ticketId: z.string().trim().min(1, "Solicitação inválida."),
  status: z.nativeEnum(SupportTicketStatus, {
    invalid_type_error: "Selecione um status válido.",
    required_error: "Selecione um status válido.",
  }),
  adminResponse: z
    .string()
    .trim()
    .max(2000, "A resposta precisa ter no máximo 2000 caracteres.")
    .optional()
    .or(z.literal("")),
});

export async function updateSupportTicketAction(
  _prevState: UpdateSupportTicketState,
  formData: FormData,
): Promise<UpdateSupportTicketState> {
  await requireAdminUser();

  const parsed = updateSupportTicketSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
    adminResponse: formData.get("adminResponse"),
  });

  if (!parsed.success) {
    return errorResult("Confira os dados e tente novamente.", "SUPPORT_UPDATE_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true },
  });

  if (!ticket) {
    return errorResult("Solicitação não encontrada.", "SUPPORT_TICKET_NOT_FOUND");
  }

  try {
    await prisma.supportTicket.update({
      where: { id: parsed.data.ticketId },
      data: {
        status: parsed.data.status,
        adminResponse: parsed.data.adminResponse || null,
      },
    });
  } catch (error) {
    logServerError("support.update-ticket", error, { ticketId: parsed.data.ticketId });
    return errorResult(
      "Não conseguimos atualizar a solicitação agora. Tente novamente ou peça apoio pelo menu Suporte.",
      "SUPPORT_UPDATE_FAILED",
    );
  }

  return successResult("Solicitação atualizada com sucesso.");
}
