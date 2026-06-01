"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EntryFrequencyProfile, EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";

import { updateFinancialEntryUseCase } from "@/lib/application/financial-entry/update-financial-entry.use-case";
import { InstallmentPurchaseAdjustmentRequiredError } from "@/lib/application/financial-entry/update-financial-entry.use-case";
import { errorResult, logServerError } from "@/lib/actions/action-result";
import { updateFinancialEntrySchema } from "@/features/lancamentos/schemas/update-financial-entry-schema";
import { CreateFinancialEntryActionState } from "@/features/lancamentos/types/financial-entry-form.types";

function toBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function getNumberFromForm(formData: FormData, name: string) {
  const rawValue = formData.get(name);

  if (rawValue == null || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function getAdjustmentStateFromForm(formData: FormData): CreateFinancialEntryActionState["installmentAdjustment"] {
  if (!toBoolean(formData.get("adjustInstallmentPurchase"))) {
    return undefined;
  }

  const currentTotalAmount = getNumberFromForm(formData, "adjustmentCurrentTotalAmount");
  const currentTotalInstallments = getNumberFromForm(formData, "adjustmentCurrentTotalInstallments");
  const requestedInstallmentNumber = getNumberFromForm(formData, "adjustmentRequestedInstallmentNumber");
  const suggestedTotalInstallments = getNumberFromForm(formData, "adjustmentSuggestedTotalInstallments");
  const nextInstallmentNumber = getNumberFromForm(formData, "adjustmentNextInstallmentNumber");

  if (
    currentTotalAmount == null ||
    currentTotalInstallments == null ||
    requestedInstallmentNumber == null ||
    suggestedTotalInstallments == null
  ) {
    return undefined;
  }

  return {
    currentTotalAmount,
    currentTotalInstallments,
    requestedInstallmentNumber,
    suggestedTotalInstallments,
    nextInstallmentNumber,
  };
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
    installmentNumber: formData.get("installmentNumber") ?? undefined,
    adjustInstallmentPurchase: toBoolean(formData.get("adjustInstallmentPurchase")),
    installmentPurchaseTotalAmount: formData.get("installmentPurchaseTotalAmount") ?? undefined,
    installmentPurchaseInstallmentCount:
      formData.get("installmentPurchaseInstallmentCount") ?? undefined,
  };

  const parsed = updateFinancialEntrySchema.safeParse(payload);

  if (!parsed.success) {
    return errorResult("Confira os campos destacados e tente novamente.", "ENTRY_UPDATE_VALIDATION_ERROR", {
      fieldErrors: parsed.error.flatten().fieldErrors,
      installmentAdjustment: getAdjustmentStateFromForm(formData),
    });
  }

  try {
    await updateFinancialEntryUseCase(parsed.data);
  } catch (error) {
    if (error instanceof InstallmentPurchaseAdjustmentRequiredError) {
      return errorResult(
        "Essa alteração ultrapassa o total atual da compra parcelada. Deseja ajustar os dados da compra?",
        "INSTALLMENT_PURCHASE_ADJUSTMENT_REQUIRED",
        {
          installmentAdjustment: error.adjustment,
        },
      );
    }

    logServerError("entries.update", error, { entryId: parsed.data.id });
    return errorResult(
      error instanceof Error
        ? error.message
        : "Não conseguimos salvar seu lançamento agora. Tente novamente ou use o suporte.",
      "ENTRY_UPDATE_FAILED",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/lancamentos");
  revalidatePath("/parcelas");
  revalidatePath(`/lancamentos/${parsed.data.id}/editar`);

  redirect("/lancamentos?status=updated");
}
