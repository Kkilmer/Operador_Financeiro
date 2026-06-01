"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InstallmentStatus } from "@prisma/client";
import { z } from "zod";

import { errorResult, logServerError } from "@/lib/actions/action-result";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { CreateFinancialEntryActionState } from "@/features/lancamentos/types/financial-entry-form.types";

const removeFinancialEntrySchema = z.object({
  id: z.string().trim().min(1, "Não encontramos o lançamento para remover."),
});

export async function removeFinancialEntryAction(
  _prevState: CreateFinancialEntryActionState,
  formData: FormData,
): Promise<CreateFinancialEntryActionState> {
  const parsed = removeFinancialEntrySchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });

  if (!parsed.success) {
    return errorResult("Não encontramos o lançamento para remover.", "ENTRY_REMOVE_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const userId = await requireCurrentUserId();

  const entry = await prisma.financialEntry.findFirst({
    where: {
      id: parsed.data.id,
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
      installment: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!entry) {
    return errorResult("Esse lançamento não foi encontrado ou já foi removido.", "ENTRY_NOT_FOUND");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.financialEntry.update({
        where: { id: entry.id },
        data: {
          deletedAt: new Date(),
        },
      });

      if (entry.installment?.id) {
        await tx.installment.update({
          where: { id: entry.installment.id },
          data: {
            status: InstallmentStatus.CANCELED,
          },
        });
      }
    });
  } catch (error) {
    logServerError("entries.remove", error, { entryId: parsed.data.id, userId });
    return errorResult(
      "Não conseguimos remover esse lançamento agora. Tente novamente ou acesse o suporte.",
      "ENTRY_REMOVE_FAILED",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/lancamentos");
  revalidatePath("/parcelas");
  revalidatePath(`/lancamentos/${parsed.data.id}/editar`);

  redirect("/lancamentos?status=removed");
}
