"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createFinancialEntryUseCase } from "@/lib/application/financial-entry/create-financial-entry.use-case";
import { errorResult, logServerError } from "@/lib/actions/action-result";
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
    return errorResult("Confira os campos destacados e tente novamente.", "ENTRY_CREATE_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    await createFinancialEntryUseCase(parsed.data);
  } catch (error) {
    logServerError("entries.create", error, {
      type: parsed.data.type,
      personId: parsed.data.personId,
      accountId: parsed.data.accountId,
    });

    return errorResult(
      error instanceof Error
        ? error.message
        : "Não conseguimos salvar seu lançamento agora. Tente novamente ou acesse o suporte.",
      "ENTRY_CREATE_FAILED",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/lancamentos");

  if (payload.presentation === "sheet") {
    return {
      success: true,
      message: "Pronto! Seu lançamento foi salvo.",
    };
  }

  redirect("/lancamentos?status=created");
}
