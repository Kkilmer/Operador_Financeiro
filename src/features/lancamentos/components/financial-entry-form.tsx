"use client";

import { CategoryType, EntryFrequencyProfile, EntryType, PaymentMethod, SettlementStatus } from "@prisma/client";
import { useActionState, useEffect, useMemo, useRef } from "react";

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
      <div className="space-y-1">
        <h1 className={mode === "sheet" ? "text-xl font-semibold text-slate-900" : "text-2xl font-semibold text-slate-900"}>
          Novo lancamento financeiro
        </h1>
        <p className="text-sm text-slate-600">
          Registre uma entrada, uma saida simples ou uma compra parcelada.
        </p>
      </div>

      {state.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Descricao</span>
          <input
            name="description"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="Ex.: Mercado do mes"
          />
          <ErrorText message={state.fieldErrors?.description?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Valor</span>
          <input
            name="amount"
            ref={amountInputRef}
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-lg"
            placeholder="0,00"
          />
          <ErrorText message={state.fieldErrors?.amount?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Data</span>
          <input
            name="eventDate"
            type="date"
            defaultValue={today}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
          <ErrorText message={state.fieldErrors?.eventDate?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Tipo</span>
          <select name="type" className="w-full rounded-2xl border border-slate-300 px-4 py-3">
            <option value={EntryType.EXPENSE}>Saida</option>
            <option value={EntryType.INCOME}>Entrada</option>
          </select>
          <ErrorText message={state.fieldErrors?.type?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Pessoa</span>
          <select name="personId" className="w-full rounded-2xl border border-slate-300 px-4 py-3">
            <option value="">Selecione</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </select>
          <ErrorText message={state.fieldErrors?.personId?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Conta ou cartao</span>
          <select name="accountId" className="w-full rounded-2xl border border-slate-300 px-4 py-3">
            <option value="">Selecione</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </select>
          <ErrorText message={state.fieldErrors?.accountId?.[0]} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Categoria de saida</span>
          <select name="categoryId" className="w-full rounded-2xl border border-slate-300 px-4 py-3">
            <option value="">Selecione</option>
            <optgroup label="Despesas">
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Entradas">
              {incomeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </optgroup>
          </select>
          <p className="text-xs text-slate-500">
            Para entradas, a categoria pode ficar em branco ou usar uma categoria do tipo entrada.
          </p>
          <ErrorText message={state.fieldErrors?.categoryId?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Forma de pagamento</span>
          <select name="paymentMethod" className="w-full rounded-2xl border border-slate-300 px-4 py-3">
            {paymentMethods.map((paymentMethodOption) => (
              <option
                key={paymentMethodOption.id}
                value={paymentMethodOption.paymentMethod}
              >
                {paymentMethodOption.label}
              </option>
            ))}
          </select>
          <ErrorText message={state.fieldErrors?.paymentMethod?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Pago ou pendente</span>
          <select
            name="settlementStatus"
            defaultValue={SettlementStatus.PENDING}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value={SettlementStatus.PENDING}>Pendente</option>
            <option value={SettlementStatus.SETTLED}>Pago</option>
          </select>
          <p className="text-xs text-slate-500">
            Pix, debito e dinheiro sao marcados como pagos automaticamente.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Fixo ou variavel</span>
          <select
            name="frequencyProfile"
            defaultValue={EntryFrequencyProfile.VARIABLE}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          >
            <option value={EntryFrequencyProfile.FIXED}>Fixo</option>
            <option value={EntryFrequencyProfile.VARIABLE}>Variavel</option>
          </select>
          <ErrorText message={state.fieldErrors?.frequencyProfile?.[0]} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr,220px]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Observacao</span>
          <textarea
            name="notes"
            rows={4}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="Detalhes adicionais, se necessario"
          />
          <ErrorText message={state.fieldErrors?.notes?.[0]} />
        </label>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isInstallment" value="true" className="size-4 rounded" />
            Parcelado
          </label>
          <ErrorText message={state.fieldErrors?.isInstallment?.[0]} />
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Quantidade de parcelas</span>
            <input
              name="installmentCount"
              type="number"
              min="0"
              defaultValue={0}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
            <ErrorText message={state.fieldErrors?.installmentCount?.[0]} />
          </label>
          <p className="text-xs text-slate-500">
            Ao parcelar, o sistema cria a compra original e as parcelas futuras automaticamente.
          </p>
        </div>
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
