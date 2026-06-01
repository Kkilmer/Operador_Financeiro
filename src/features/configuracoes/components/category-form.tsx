"use client";

import { CategoryType } from "@prisma/client";
import { useActionState, useEffect } from "react";

import { ColorPicker } from "@/features/configuracoes/components/color-picker";
import { createCategoryAction } from "@/features/configuracoes/actions/create-category";
import { IconPicker } from "@/features/configuracoes/components/icon-picker";
import { updateCategoryAction } from "@/features/configuracoes/actions/update-category";
import {
  SettingsFormState,
  initialSettingsFormState,
} from "@/features/configuracoes/types/settings-action.types";

type CategoryFormValues = {
  id?: string;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  isActive: boolean;
};

type CategoryFormProps = {
  initialValues?: CategoryFormValues | null;
  onCancel?: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

export function CategoryForm({ initialValues, onCancel }: CategoryFormProps) {
  const action = initialValues?.id ? updateCategoryAction : createCategoryAction;
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
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {initialValues?.id ? "Editar categoria" : "Adicionar categoria"}
          </h3>
          <p className="text-sm text-slate-500">
            Categorias inativas saem dos novos lançamentos, mas continuam no histórico.
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
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
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            placeholder="Ex.: Mercado"
          />
          <FieldError message={state.fieldErrors?.name?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Tipo</span>
          <select
            name="type"
            defaultValue={initialValues?.type ?? CategoryType.EXPENSE}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
          >
            <option value={CategoryType.INCOME}>Entrada</option>
            <option value={CategoryType.EXPENSE}>Saída</option>
            <option value={CategoryType.BOTH}>Ambos</option>
            <option value={CategoryType.INVESTMENT}>Guardado / Reserva</option>
          </select>
          <FieldError message={state.fieldErrors?.type?.[0]} />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr),minmax(0,1.15fr)]">
        <ColorPicker
          name="color"
          defaultValue={initialValues?.color}
          error={state.fieldErrors?.color?.[0]}
        />
        <IconPicker
          name="icon"
          defaultValue={initialValues?.icon}
          error={state.fieldErrors?.icon?.[0]}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialValues?.isActive ?? true}
          className="size-4 rounded"
        />
        Categoria ativa
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-500 sm:w-auto"
        >
          {initialValues?.id ? "Salvar alterações" : "Criar categoria"}
        </button>
      </div>
    </form>
  );
}
