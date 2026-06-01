"use server";

import { revalidatePath } from "next/cache";
import { EntryOrigin, EntryType, InstallmentStatus, SettlementStatus } from "@prisma/client";

import { requireCurrentUserId } from "@/lib/auth/session";
import { errorResult, logServerError, successResult } from "@/lib/actions/action-result";
import { prisma } from "@/lib/prisma/client";

type MarkFinancialEntryAsPaidResult = {
  success: boolean;
  message: string;
  errorCode?: string;
};

export async function markFinancialEntryAsPaidAction(
  financialEntryId: string,
): Promise<MarkFinancialEntryAsPaidResult> {
  const userId = await requireCurrentUserId();

  if (!financialEntryId?.trim()) {
    return {
      ...errorResult("Não encontramos o lançamento para atualizar.", "ENTRY_NOT_FOUND"),
      message: "Não encontramos o lançamento para atualizar.",
    };
  }

  const entry = await prisma.financialEntry.findFirst({
    where: {
      id: financialEntryId,
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
      type: true,
      origin: true,
      settlementStatus: true,
      installment: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!entry) {
    return {
      ...errorResult("Esse lançamento não foi encontrado.", "ENTRY_NOT_FOUND"),
      message: "Esse lançamento não foi encontrado.",
    };
  }

  if (entry.type !== EntryType.EXPENSE) {
    return {
      ...errorResult("Só saídas pendentes podem ser marcadas como pagas.", "ENTRY_INVALID_STATUS"),
      message: "Só saídas pendentes podem ser marcadas como pagas.",
    };
  }

  if (entry.settlementStatus === SettlementStatus.SETTLED) {
    return successResult("Esse lançamento já estava marcado como pago.");
  }

  try {
    await prisma.financialEntry.update({
      where: { id: financialEntryId },
      data: {
        settlementStatus: SettlementStatus.SETTLED,
        origin: entry.origin === EntryOrigin.RECURRING_GENERATED ? EntryOrigin.MANUAL : entry.origin,
      },
    });

    if (entry.installment?.id) {
      await prisma.installment.update({
        where: { id: entry.installment.id },
        data: {
          status: InstallmentStatus.SETTLED,
        },
      });
    }
  } catch (error) {
    logServerError("entries.mark-as-paid", error, { financialEntryId });
    return errorResult(
      "Não conseguimos marcar esse lançamento como pago agora. Tente novamente ou use o suporte.",
      "ENTRY_MARK_AS_PAID_FAILED",
    );
  }

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  revalidatePath("/parcelas");

  return successResult("Pronto! O lançamento foi marcado como pago.");
}
