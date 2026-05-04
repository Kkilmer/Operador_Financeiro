"use server";

import { revalidatePath } from "next/cache";
import { EntryOrigin, EntryType, InstallmentStatus, SettlementStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

type MarkFinancialEntryAsPaidResult = {
  success: boolean;
  message: string;
};

export async function markFinancialEntryAsPaidAction(
  financialEntryId: string,
): Promise<MarkFinancialEntryAsPaidResult> {
  if (!financialEntryId?.trim()) {
    return {
      success: false,
      message: "Não encontramos o lançamento para atualizar.",
    };
  }

  const entry = await prisma.financialEntry.findUnique({
    where: { id: financialEntryId },
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
      success: false,
      message: "Esse lançamento não foi encontrado.",
    };
  }

  if (entry.type !== EntryType.EXPENSE) {
    return {
      success: false,
      message: "Só saídas pendentes podem ser marcadas como pagas.",
    };
  }

  if (entry.settlementStatus === SettlementStatus.SETTLED) {
    return {
      success: true,
      message: "Esse lançamento já estava marcado como pago.",
    };
  }

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

  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
  revalidatePath("/parcelas");

  return {
    success: true,
    message: "Pronto! O lançamento foi marcado como pago.",
  };
}
