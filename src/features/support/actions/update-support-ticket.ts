"use server";

import { SupportTicketStatus } from "@prisma/client";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export type UpdateSupportTicketState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const updateSupportTicketSchema = z.object({
  ticketId: z.string().trim().min(1, "Solicitacao invalida."),
  status: z.nativeEnum(SupportTicketStatus, {
    invalid_type_error: "Selecione um status valido.",
    required_error: "Selecione um status valido.",
  }),
  adminResponse: z
    .string()
    .trim()
    .max(2000, "A resposta precisa ter no maximo 2000 caracteres.")
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
    return {
      success: false,
      message: "Nao foi possivel atualizar a solicitacao.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true },
  });

  if (!ticket) {
    return {
      success: false,
      message: "Solicitacao nao encontrada.",
    };
  }

  await prisma.supportTicket.update({
    where: { id: parsed.data.ticketId },
    data: {
      status: parsed.data.status,
      adminResponse: parsed.data.adminResponse || null,
    },
  });

  return {
    success: true,
    message: "Solicitacao atualizada.",
  };
}
