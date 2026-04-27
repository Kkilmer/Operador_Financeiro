"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createFinancialEntryUseCase } from "@/lib/application/financial-entry/create-financial-entry.use-case";
import { createFinancialEntrySchema } from "@/features/lancamentos/schemas/create-financial-entry-schema";
import { CreateFinancialEntryActionState } from "@/features/lancamentos/types/financial-entry-form.types";

function toBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function createFinancialEntryAction(
  _prevState: CreateFinancialEntryActionState,
  formData: FormData,
): Promise<CreateFinancialEntryActionState> {
  const payload = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    eventDate: formData.get("eventDate"),
    type: formData.get("type"),
    personId: formData.get("personId"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes"),
    settlementStatus: formData.get("settlementStatus"),
    frequencyProfile: formData.get("frequencyProfile"),
    isInstallment: toBoolean(formData.get("isInstallment")),
    installmentCount: formData.get("installmentCount") || 0,
    presentation: formData.get("presentation"),
  };

  const parsed = createFinancialEntrySchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os campos destacados e tente novamente.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createFinancialEntryUseCase(parsed.data);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o lancamento agora.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/lancamentos");

  if (payload.presentation === "sheet") {
    return {
      success: true,
      message: "Lancamento salvo com sucesso.",
    };
  }

  redirect("/lancamentos");
}
