"use client";

import {
  CategoryType,
  EntryFrequencyProfile,
  EntryType,
  PaymentMethod,
  SettlementStatus,
} from "@prisma/client";
import { useActionState, useEffect, useMemo, useState } from "react";

import { updateFinancialEntryAction } from "@/features/lancamentos/actions/update-financial-entry";
import { SubmitButton } from "@/features/lancamentos/components/submit-button";
import { CreateFinancialEntryActionState } from "@/features/lancamentos/types/financial-entry-form.types";

type SelectOption = {
  id: string;
  label: string;
};

type CategoryOption = SelectOption & {
  type: CategoryType;
};

type PaymentMethodOption = SelectOption & {
  paymentMethod: PaymentMethod;
};

type FinancialEntryEditFormProps = {
  people: SelectOption[];
  accounts: SelectOption[];
  categories: CategoryOption[];
  paymentMethods: PaymentMethodOption[];
  initialValues: {
    id: string;
    description: string;
    amount: number;
    eventDate: string;
    type: EntryType;
    personId: string;
    accountId: string;
    categoryId: string;
    paymentMethod: PaymentMethod;
    settlementStatus: SettlementStatus;
    frequencyProfile: EntryFrequencyProfile;
    notes: string;
    isInstallmentEntry: boolean;
    installmentLabel: string | null;
    installmentNumber: number | null;
    installmentCount: number | null;
    installmentPurchaseTotalAmount: number | null;
  };
};

const initialState: CreateFinancialEntryActionState = {
  success: false,
};

function ErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}

export function FinancialEntryEditForm({
  people,
  accounts,
  categories,
  paymentMethods,
  initialValues,
}: FinancialEntryEditFormProps) {
  const [state, formAction] = useActionState(updateFinancialEntryAction, initialState);
  const isInstallmentEntry = initialValues.isInstallmentEntry;
  const defaultExpensePaymentMethod =
    paymentMethods.find((paymentMethodOption) => paymentMethodOption.paymentMethod !== PaymentMethod.OTHER)
      ?.paymentMethod ??
    paymentMethods[0]?.paymentMethod ??
    PaymentMethod.OTHER;
  const [selectedType, setSelectedType] = useState<EntryType>(initialValues.type);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialValues.categoryId);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(initialValues.paymentMethod);
  const [selectedSettlementStatus, setSelectedSettlementStatus] = useState<SettlementStatus>(
    initialValues.settlementStatus,
  );
  const [selectedInstallmentNumber, setSelectedInstallmentNumber] = useState(
    initialValues.installmentNumber?.toString() ?? "",
  );
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedFrequencyProfile, setSelectedFrequencyProfile] = useState<EntryFrequencyProfile>(
    initialValues.frequencyProfile,
  );
  const isExpense = selectedType === EntryType.EXPENSE;
  const isIncome = selectedType === EntryType.INCOME;
  const isSaved = selectedType === EntryType.SAVED;
  const adjustment = state.installmentAdjustment;

  const visibleCategories = useMemo(() => {
    if (selectedType === EntryType.INCOME) {
      return categories.filter(
        (category) => category.type === CategoryType.INCOME || category.type === CategoryType.BOTH,
      );
    }

    if (selectedType === EntryType.SAVED) {
      return categories.filter((category) => category.type === CategoryType.INVESTMENT);
    }

    return categories.filter(
      (category) => category.type === CategoryType.EXPENSE || category.type === CategoryType.BOTH,
    );
  }, [categories, selectedType]);

  useEffect(() => {
    if (isInstallmentEntry) {
      return;
    }

    if (selectedType === EntryType.INCOME || selectedType === EntryType.SAVED) {
      setSelectedPaymentMethod(PaymentMethod.OTHER);
      setSelectedSettlementStatus(SettlementStatus.SETTLED);
      setSelectedFrequencyProfile(EntryFrequencyProfile.VARIABLE);

      const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
      if (
        selectedCategory &&
        ((selectedType === EntryType.INCOME &&
          selectedCategory.type !== CategoryType.INCOME &&
          selectedCategory.type !== CategoryType.BOTH) ||
          (selectedType === EntryType.SAVED && selectedCategory.type !== CategoryType.INVESTMENT))
      ) {
        setSelectedCategoryId("");
      }

      return;
    }

    if (selectedPaymentMethod === PaymentMethod.OTHER) {
      setSelectedPaymentMethod(defaultExpensePaymentMethod);
    }

    if (initialValues.type !== EntryType.EXPENSE && selectedSettlementStatus === SettlementStatus.SETTLED) {
      setSelectedSettlementStatus(SettlementStatus.PENDING);
    }

    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
    if (
      selectedCategory &&
      selectedCategory.type !== CategoryType.EXPENSE &&
      selectedCategory.type !== CategoryType.BOTH
    ) {
      setSelectedCategoryId("");
    }
  }, [
    categories,
    defaultExpensePaymentMethod,
    initialValues.type,
    isInstallmentEntry,
    selectedCategoryId,
    selectedPaymentMethod,
    selectedSettlementStatus,
    selectedType,
  ]);

  useEffect(() => {
    if (state.installmentAdjustment) {
      setIsAdjustmentModalOpen(true);
    }
  }, [state.installmentAdjustment]);

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="id" value={initialValues.id} />
      <input type="hidden" name="type" value={selectedType} />
      <input type="hidden" name="isInstallment" value="false" />
      <input type="hidden" name="installmentCount" value="0" />
      <input type="hidden" name="isInstallmentEntry" value={isInstallmentEntry ? "true" : "false"} />
      <input type="hidden" name="paymentMethod" value={isExpense ? selectedPaymentMethod : PaymentMethod.OTHER} />
      <input
        type="hidden"
        name="settlementStatus"
        value={isExpense ? selectedSettlementStatus : SettlementStatus.SETTLED}
      />
      <input
        type="hidden"
        name="frequencyProfile"
        value={isExpense ? selectedFrequencyProfile : EntryFrequencyProfile.VARIABLE}
      />
      {isInstallmentEntry ? (
        <>
          <input type="hidden" name="personId" value={initialValues.personId} />
          <input type="hidden" name="accountId" value={initialValues.accountId} />
        </>
      ) : null}

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Editar lançamento</h1>
        <p className="text-sm text-slate-600">Atualize as informações do lançamento com segurança.</p>
      </div>

      {isInstallmentEntry ? (
        <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div>
            Este lançamento é uma parcela. As alterações financeiras serão aplicadas somente nesta
            parcela.
            {initialValues.installmentLabel ? (
              <span className="mt-2 block font-medium text-amber-900">
                Parcela atual: {initialValues.installmentLabel}
              </span>
            ) : null}
          </div>

          {initialValues.installmentNumber && initialValues.installmentCount ? (
            <label className="block max-w-xs space-y-2">
              <span className="text-sm font-medium text-amber-900">Número da parcela</span>
              <div className="flex items-center gap-2">
                <input
                  name="installmentNumber"
                  type="number"
                  min={1}
                  value={selectedInstallmentNumber}
                  onChange={(event) => setSelectedInstallmentNumber(event.target.value)}
                  className="w-28 rounded-2xl border border-amber-300 bg-white px-4 py-3 text-slate-900"
                />
                <span className="text-sm font-medium text-amber-900">
                  / {initialValues.installmentCount}
                </span>
              </div>
              <p className="text-xs text-amber-800">
                Se alterar este número, as próximas parcelas em aberto serão ajustadas em sequência.
              </p>
              <ErrorText message={state.fieldErrors?.installmentNumber?.[0]} />
            </label>
          ) : null}
        </div>
      ) : null}

      {state.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      {isAdjustmentModalOpen && adjustment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-600">Compra parcelada</p>
              <h2 className="text-2xl font-semibold text-slate-900">Ajustar dados da compra?</h2>
              <p className="text-sm text-slate-600">
                Essa alteração ultrapassa o total atual da compra parcelada. Se você confirmar,
                ajustaremos somente esta compra e as próximas parcelas em aberto.
              </p>
            </div>

            <input type="hidden" name="adjustInstallmentPurchase" value="true" />
            <input
              type="hidden"
              name="adjustmentCurrentTotalAmount"
              value={adjustment.currentTotalAmount}
            />
            <input
              type="hidden"
              name="adjustmentCurrentTotalInstallments"
              value={adjustment.currentTotalInstallments}
            />
            <input
              type="hidden"
              name="adjustmentRequestedInstallmentNumber"
              value={adjustment.requestedInstallmentNumber}
            />
            <input
              type="hidden"
              name="adjustmentSuggestedTotalInstallments"
              value={adjustment.suggestedTotalInstallments}
            />
            <input
              type="hidden"
              name="adjustmentNextInstallmentNumber"
              value={adjustment.nextInstallmentNumber ?? ""}
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Valor total da compra</span>
                <input
                  name="installmentPurchaseTotalAmount"
                  defaultValue={(initialValues.installmentPurchaseTotalAmount ?? adjustment.currentTotalAmount)
                    .toFixed(2)
                    .replace(".", ",")}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
                <ErrorText message={state.fieldErrors?.installmentPurchaseTotalAmount?.[0]} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Quantidade total de parcelas</span>
                <input
                  name="installmentPurchaseInstallmentCount"
                  type="number"
                  min={adjustment.suggestedTotalInstallments}
                  defaultValue={adjustment.suggestedTotalInstallments}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
                <p className="text-xs text-slate-500">
                  Atual: {adjustment.currentTotalInstallments}. Mínimo sugerido:{" "}
                  {adjustment.suggestedTotalInstallments}.
                </p>
                <ErrorText message={state.fieldErrors?.installmentPurchaseInstallmentCount?.[0]} />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">Resumo do impacto</p>
              <ul className="mt-2 space-y-1">
                <li>
                  Parcela atual será {adjustment.requestedInstallmentNumber}/
                  {adjustment.suggestedTotalInstallments}
                </li>
                {adjustment.nextInstallmentNumber ? (
                  <li>
                    Próxima parcela em aberto será {adjustment.nextInstallmentNumber}/
                    {adjustment.suggestedTotalInstallments}
                  </li>
                ) : null}
                <li>Parcelas anteriores, pagas ou removidas não serão alteradas.</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedInstallmentNumber(initialValues.installmentNumber?.toString() ?? "");
                  setIsAdjustmentModalOpen(false);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Manter como está
              </button>
              <SubmitButton label="Atualizar compra parcelada" pendingLabel="Atualizando..." />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-medium text-slate-700">O que foi?</span>
            <input
              name="description"
              defaultValue={initialValues.description}
              className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
            />
            <ErrorText message={state.fieldErrors?.description?.[0]} />
          </label>
        </Field>

        <Field>
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-medium text-slate-700">Valor</span>
            <input
              name="amount"
              defaultValue={initialValues.amount.toString().replace(".", ",")}
              className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 text-lg"
            />
            <ErrorText message={state.fieldErrors?.amount?.[0]} />
          </label>
        </Field>

        <Field>
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-medium text-slate-700">Data</span>
            <input
              name="eventDate"
              type="date"
              defaultValue={initialValues.eventDate}
              className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
            />
            <ErrorText message={state.fieldErrors?.eventDate?.[0]} />
          </label>
        </Field>

        <Field>
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-medium text-slate-700">Tipo</span>
            {isInstallmentEntry ? (
              <input
                value="Saída"
                disabled
                className="w-full min-w-0 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
              />
            ) : (
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as EntryType)}
                className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value={EntryType.EXPENSE}>Saída</option>
                <option value={EntryType.INCOME}>Entrada</option>
                <option value={EntryType.SAVED}>Guardado / Poupança</option>
              </select>
            )}
          </label>
        </Field>

        <Field>
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-medium text-slate-700">Quem fez?</span>
            <select
              name="personId"
              defaultValue={initialValues.personId}
              disabled={isInstallmentEntry}
              className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50"
            >
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.label}
                </option>
              ))}
            </select>
            <ErrorText message={state.fieldErrors?.personId?.[0]} />
          </label>
        </Field>

        <Field>
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-medium text-slate-700">
              {isSaved ? "De onde saiu esse dinheiro?" : "Conta ou cartão"}
            </span>
            <select
              name="accountId"
              defaultValue={initialValues.accountId}
              disabled={isInstallmentEntry}
              className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </select>
            <ErrorText message={state.fieldErrors?.accountId?.[0]} />
          </label>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <label className="block min-w-0 space-y-2">
            <span className="text-sm font-medium text-slate-700">
              {isIncome
                ? "Categoria da entrada"
                : isSaved
                  ? "Onde você guardou esse dinheiro?"
                  : "Categoria da saída"}
            </span>
            <select
              name="categoryId"
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="">Selecione</option>
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <ErrorText message={state.fieldErrors?.categoryId?.[0]} />
          </label>
        </Field>

        {isExpense ? (
          <Field>
            <label className="block min-w-0 space-y-2">
              <span className="text-sm font-medium text-slate-700">Como você pagou?</span>
              <select
                value={selectedPaymentMethod}
                onChange={(event) => setSelectedPaymentMethod(event.target.value as PaymentMethod)}
                disabled={isInstallmentEntry}
                className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50"
              >
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod.id} value={paymentMethod.paymentMethod}>
                    {paymentMethod.label}
                  </option>
                ))}
              </select>
              <ErrorText message={state.fieldErrors?.paymentMethod?.[0]} />
            </label>
          </Field>
        ) : null}
      </div>

      {isExpense ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field>
            <label className="block min-w-0 space-y-2">
              <span className="text-sm font-medium text-slate-700">Esse gasto já foi pago?</span>
              <select
                value={selectedSettlementStatus}
                onChange={(event) => setSelectedSettlementStatus(event.target.value as SettlementStatus)}
                className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value={SettlementStatus.PENDING}>Pendente</option>
                <option value={SettlementStatus.SETTLED}>Pago</option>
              </select>
              <ErrorText message={state.fieldErrors?.settlementStatus?.[0]} />
            </label>
          </Field>

          <Field>
            <label className="block min-w-0 space-y-2">
              <span className="text-sm font-medium text-slate-700">Esse gasto é fixo?</span>
              <select
                value={selectedFrequencyProfile}
                onChange={(event) =>
                  setSelectedFrequencyProfile(event.target.value as EntryFrequencyProfile)
                }
                disabled={isInstallmentEntry}
                className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 disabled:bg-slate-50"
              >
                <option value={EntryFrequencyProfile.FIXED}>Sim, acontece com frequência</option>
                <option value={EntryFrequencyProfile.VARIABLE}>Não, foi pontual</option>
              </select>
              <ErrorText message={state.fieldErrors?.frequencyProfile?.[0]} />
            </label>
          </Field>
        </div>
      ) : null}

      <Field>
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-slate-700">Observação</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={initialValues.notes}
            className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
          />
          <ErrorText message={state.fieldErrors?.notes?.[0]} />
        </label>
      </Field>

      <div className="flex items-center justify-end gap-3">
        <a
          href="/lancamentos"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </a>
        <SubmitButton label="Salvar mudanças" pendingLabel="Salvando..." />
      </div>
    </form>
  );
}
