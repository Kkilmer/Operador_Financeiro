"use client";

import { AccountType } from "@prisma/client";
import { useActionState, useEffect } from "react";

import { createAccountAction } from "@/features/configuracoes/actions/create-account";
import { updateAccountAction } from "@/features/configuracoes/actions/update-account";
import {
  SettingsFormState,
  initialSettingsFormState,
} from "@/features/configuracoes/types/settings-action.types";

type AccountFormValues = {
  id?: string;
  name: string;
  institutionName: string | null;
  ownerPersonId: string;
  type: AccountType;
  initialBalance: number | null;
  creditLimit: number | null;
  closingDay: number | null;
  dueDay: number | null;
  isActive: boolean;
};

type PersonOption = {
  id: string;
  name: string;
};

type AccountFormProps = {
  people: PersonOption[];
  initialValues?: AccountFormValues | null;
  onCancel?: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

function accountTypeLabel(type: AccountType) {
  switch (type) {
    case AccountType.CHECKING:
      return "Conta corrente";
    case AccountType.SAVINGS:
      return "Conta poupanca";
    case AccountType.DIGITAL_WALLET:
      return "Carteira digital";
    case AccountType.CASH:
      return "Dinheiro fisico";
    case AccountType.CREDIT_CARD:
      return "Cartao de credito";
    case AccountType.DEBIT_CARD:
      return "Cartao de debito";
    case AccountType.MULTIPLE_CARD:
      return "Cartao multiplo";
    case AccountType.INVESTMENT:
      return "Investimento";
    default:
      return "Outro";
  }
}

export function AccountForm({ people, initialValues, onCancel }: AccountFormProps) {
  const action = initialValues?.id ? updateAccountAction : createAccountAction;
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    action,
    initialSettingsFormState,
  );

  useEffect(() => {
    if (state.success) {
      onCancel?.();
    }
  }, [onCancel, state.success]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {initialValues?.id ? "Editar conta ou cartao" : "Adicionar conta ou cartao"}
          </h3>
          <p className="text-sm text-slate-500">
            Itens inativos saem dos novos lancamentos, mas continuam no historico.
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
          >
            Cancelar
          </button>
        ) : null}
      </div>

      {state.message ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            state.success
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <input
            name="name"
            defaultValue={initialValues?.name ?? ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            placeholder="Ex.: Conta Nubank Kevin"
          />
          <FieldError message={state.fieldErrors?.name?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Instituicao ou banco</span>
          <input
            name="institutionName"
            defaultValue={initialValues?.institutionName ?? ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            placeholder="Ex.: Nubank"
          />
          <FieldError message={state.fieldErrors?.institutionName?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Titular</span>
          <select
            name="ownerPersonId"
            defaultValue={initialValues?.ownerPersonId ?? ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Selecione</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.ownerPersonId?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Tipo</span>
          <select
            name="type"
            defaultValue={initialValues?.type ?? AccountType.CHECKING}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            {Object.values(AccountType).map((type) => (
              <option key={type} value={type}>
                {accountTypeLabel(type)}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.type?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Saldo inicial</span>
          <input
            name="initialBalance"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues?.initialBalance ?? 0}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          />
          <FieldError message={state.fieldErrors?.initialBalance?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Limite</span>
          <input
            name="creditLimit"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues?.creditLimit ?? ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            placeholder="Opcional para cartoes de credito"
          />
          <FieldError message={state.fieldErrors?.creditLimit?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Dia de fechamento</span>
          <input
            name="closingDay"
            type="number"
            min="1"
            max="31"
            defaultValue={initialValues?.closingDay ?? ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            placeholder="Opcional"
          />
          <FieldError message={state.fieldErrors?.closingDay?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Dia de vencimento</span>
          <input
            name="dueDay"
            type="number"
            min="1"
            max="31"
            defaultValue={initialValues?.dueDay ?? ""}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
            placeholder="Opcional"
          />
          <FieldError message={state.fieldErrors?.dueDay?.[0]} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialValues?.isActive ?? true}
          className="size-4 rounded"
        />
        Conta ou cartao ativo
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          {initialValues?.id ? "Salvar alteracoes" : "Criar conta ou cartao"}
        </button>
      </div>
    </form>
  );
}

