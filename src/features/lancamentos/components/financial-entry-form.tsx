"use client";

import { CategoryType, EntryFrequencyProfile, EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { createFinancialEntryAction } from "@/features/lancamentos/actions/create-financial-entry";
import { CreateFinancialEntryActionState } from "@/features/lancamentos/types/financial-entry-form.types";
import { SubmitButton } from "@/features/lancamentos/components/submit-button";

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

type FinancialEntryFormProps = {
  people: SelectOption[];
  accounts: SelectOption[];
  categories: CategoryOption[];
  paymentMethods: PaymentMethodOption[];
  mode?: "page" | "sheet";
  onSuccess?: () => void;
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

export function FinancialEntryForm({
  people,
  accounts,
  categories,
  paymentMethods,
  mode = "page",
  onSuccess,
}: FinancialEntryFormProps) {
  const [state, formAction] = useActionState(createFinancialEntryAction, initialState);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const defaultExpensePaymentMethod =
    paymentMethods.find((paymentMethodOption) => paymentMethodOption.paymentMethod !== PaymentMethod.OTHER)?.paymentMethod ??
    paymentMethods[0]?.paymentMethod ??
    PaymentMethod.OTHER;
  const [selectedType, setSelectedType] = useState<EntryType>(EntryType.EXPENSE);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(defaultExpensePaymentMethod);
  const [selectedSettlementStatus, setSelectedSettlementStatus] = useState<SettlementStatus>(SettlementStatus.PENDING);
  const [selectedFrequencyProfile, setSelectedFrequencyProfile] = useState<EntryFrequencyProfile>(
    EntryFrequencyProfile.VARIABLE,
  );
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState("0");

  const incomeCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === CategoryType.INCOME || category.type === CategoryType.BOTH,
      ),
    [categories],
  );

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === CategoryType.EXPENSE || category.type === CategoryType.BOTH,
      ),
    [categories],
  );
  const savedCategories = useMemo(
    () => categories.filter((category) => category.type === CategoryType.INVESTMENT),
    [categories],
  );
  const visibleCategories =
    selectedType === EntryType.INCOME
      ? incomeCategories
      : selectedType === EntryType.SAVED
        ? savedCategories
        : expenseCategories;
  const isExpense = selectedType === EntryType.EXPENSE;
  const isIncome = selectedType === EntryType.INCOME;
  const isSaved = selectedType === EntryType.SAVED;

  useEffect(() => {
    if (mode === "sheet") {
      amountInputRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    if (state.success && mode === "sheet") {
      onSuccess?.();
    }
  }, [mode, onSuccess, state.success]);

  useEffect(() => {
    if (selectedType === EntryType.INCOME || selectedType === EntryType.SAVED) {
      setSelectedPaymentMethod(PaymentMethod.OTHER);
      setSelectedSettlementStatus(SettlementStatus.SETTLED);
      setSelectedFrequencyProfile(EntryFrequencyProfile.VARIABLE);
      setIsInstallment(false);
      setInstallmentCount("0");

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

    if (selectedSettlementStatus === SettlementStatus.SETTLED) {
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
    selectedCategoryId,
    selectedPaymentMethod,
    selectedSettlementStatus,
    selectedType,
  ]);

  return (
    <form
      action={formAction}
      className={
        mode === "sheet"
          ? "space-y-5"
          : "space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      }
    >
      <input type="hidden" name="presentation" value={mode} />
      <input
        type="hidden"
        name="paymentMethod"
        value={isExpense ? selectedPaymentMethod : PaymentMethod.OTHER}
      />
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
      <input type="hidden" name="installmentCount" value={isExpense ? installmentCount : "0"} />
      {!isExpense ? <input type="hidden" name="isInstallment" value="false" /> : null}

      <div className="space-y-1">
        <h1 className={mode === "sheet" ? "text-xl font-semibold text-slate-900" : "text-2xl font-semibold text-slate-900"}>
          Novo lançamento
        </h1>
        <p className="text-sm text-slate-600">
          Registre uma entrada, um gasto do dia a dia ou um valor que foi guardado.
        </p>
      </div>

      {state.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      <div key={`category-section-${selectedType}`} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-slate-700">O que foi?</span>
          <input
            name="description"
            className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="Ex.: Mercado do mês"
          />
          <ErrorText message={state.fieldErrors?.description?.[0]} />
        </label>
        </Field>

        <Field>
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-slate-700">Valor</span>
          <input
            name="amount"
            ref={amountInputRef}
            type="text"
            inputMode="decimal"
            className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 text-lg"
            placeholder="0,00"
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
            defaultValue={today}
            className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
          />
          <ErrorText message={state.fieldErrors?.eventDate?.[0]} />
        </label>
        </Field>

        <Field>
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-slate-700">Que tipo de lançamento é esse?</span>
          <select
            name="type"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as EntryType)}
            className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value={EntryType.EXPENSE}>Saída</option>
            <option value={EntryType.INCOME}>Entrada</option>
            <option value={EntryType.SAVED}>Guardado / Poupança</option>
          </select>
          <ErrorText message={state.fieldErrors?.type?.[0]} />
        </label>
        </Field>

        <Field>
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-slate-700">Quem fez?</span>
          <select name="personId" className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3">
            <option value="">Selecione</option>
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
            {isSaved ? "De onde saiu esse dinheiro?" : "De onde saiu ou entrou o dinheiro?"}
          </span>
          <select name="accountId" className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3">
            <option value="">Selecione</option>
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
          <p className="text-xs text-slate-500">
            {isIncome
              ? "Escolha a categoria que melhor representa essa entrada."
              : isSaved
                ? "Escolha o destino em que esse dinheiro foi guardado."
                : "Escolha a categoria que melhor representa esse gasto."}
          </p>
          <ErrorText message={state.fieldErrors?.categoryId?.[0]} />
        </label>
        </Field>

        {!isExpense ? <div className="hidden md:block" aria-hidden="true" /> : null}
      </div>

      {isExpense ? (
        <div
          key={`expense-section-${selectedType}`}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <Field>
            <label className="block min-w-0 space-y-2">
              <span className="text-sm font-medium text-slate-700">Como você pagou?</span>
              <select
                value={selectedPaymentMethod}
                onChange={(event) => setSelectedPaymentMethod(event.target.value as PaymentMethod)}
                className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
              >
                {paymentMethods.map((paymentMethodOption) => (
                  <option key={paymentMethodOption.id} value={paymentMethodOption.paymentMethod}>
                    {paymentMethodOption.label}
                  </option>
                ))}
              </select>
              <ErrorText message={state.fieldErrors?.paymentMethod?.[0]} />
            </label>
          </Field>

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
              <p className="text-xs text-slate-500">
                Pix, débito e dinheiro normalmente já entram como pagos.
              </p>
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
                className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value={EntryFrequencyProfile.FIXED}>Sim, acontece com frequência</option>
                <option value={EntryFrequencyProfile.VARIABLE}>Não, foi pontual</option>
              </select>
              <ErrorText message={state.fieldErrors?.frequencyProfile?.[0]} />
            </label>
          </Field>
        </div>
      ) : null}

      <div
        key={`notes-section-${selectedType}`}
        className={`grid grid-cols-1 gap-4 ${isExpense ? "xl:grid-cols-[minmax(0,1fr),240px]" : ""}`}
      >
        <Field>
        <label className="block min-w-0 space-y-2">
          <span className="text-sm font-medium text-slate-700">Quer adicionar algum detalhe?</span>
          <textarea
            name="notes"
            rows={4}
            className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="Ex.: compra da semana, presente, pagamento do cliente"
          />
          <ErrorText message={state.fieldErrors?.notes?.[0]} />
        </label>
        </Field>

        {isExpense ? (
          <div className="min-w-0 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                name="isInstallment"
                checked={isInstallment}
                onChange={(event) => {
                  setIsInstallment(event.target.checked);
                  if (!event.target.checked) {
                    setInstallmentCount("0");
                  }
                }}
                value="true"
                className="size-4 rounded"
              />
              Foi parcelado?
            </label>
            <ErrorText message={state.fieldErrors?.isInstallment?.[0]} />
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Em quantas parcelas?</span>
              <input
                type="number"
                min="0"
                value={installmentCount}
                onChange={(event) => setInstallmentCount(event.target.value)}
                className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3"
                disabled={!isInstallment}
              />
              <ErrorText message={state.fieldErrors?.installmentCount?.[0]} />
            </label>
            <p className="text-xs text-slate-500">
              Se estiver parcelado, vamos organizar as próximas parcelas para você.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3">
        {mode === "page" ? (
          <a
            href="/lancamentos"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </a>
        ) : null}
        <SubmitButton />
      </div>
    </form>
  );
}
