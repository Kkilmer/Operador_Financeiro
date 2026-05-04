"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EntryFrequencyProfile, EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";

import { updateFinancialEntryUseCase } from "@/lib/application/financial-entry/update-financial-entry.use-case";
import { updateFinancialEntrySchema } from "@/features/lancamentos/schemas/update-financial-entry-schema";
import { CreateFinancialEntryActionState } from "@/features/lancamentos/types/financial-entry-form.types";

function toBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function updateFinancialEntryAction(
  _prevState: CreateFinancialEntryActionState,
  formData: FormData,
): Promise<CreateFinancialEntryActionState> {
  const payload = {
    id: String(formData.get("id") ?? ""),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    type: formData.get("type") as EntryType,
    personId: String(formData.get("personId") ?? ""),
    accountId: String(formData.get("accountId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    paymentMethod: (formData.get("paymentMethod") as PaymentMethod | null) ?? undefined,
    notes: String(formData.get("notes") ?? ""),
    settlementStatus: (formData.get("settlementStatus") as SettlementStatus | null) ?? undefined,
    frequencyProfile:
      (formData.get("frequencyProfile") as EntryFrequencyProfile | null) ?? undefined,
    isInstallment: toBoolean(formData.get("isInstallment")),
    installmentCount: Number(formData.get("installmentCount") || 0),
    isInstallmentEntry: toBoolean(formData.get("isInstallmentEntry")),
  };

  const parsed = updateFinancialEntrySchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Confira os campos destacados e tente novamente.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateFinancialEntryUseCase(parsed.data);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Não conseguimos salvar agora. Tente novamente.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/lancamentos");
  revalidatePath("/parcelas");
  revalidatePath(`/lancamentos/${parsed.data.id}/editar`);

  redirect("/lancamentos?status=updated");
}
