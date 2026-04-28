"use client";

import { PaymentMethod, PaymentMethodBehavior } from "@prisma/client";
import { useActionState, useEffect } from "react";

import { createPaymentMethodAction } from "@/features/configuracoes/actions/create-payment-method";
import { updatePaymentMethodAction } from "@/features/configuracoes/actions/update-payment-method";
import {
  SettingsFormState,
  initialSettingsFormState,
} from "@/features/configuracoes/types/settings-action.types";

type PaymentMethodFormValues = {
  id?: string;
  name: string;
  behavior: PaymentMethodBehavior;
  paymentMethod: PaymentMethod;
  requiresInstallments: boolean;
  immediateSettlement: boolean;
  isActive: boolean;
};

type PaymentMethodFormProps = {
  initialValues?: PaymentMethodFormValues | null;
  onCancel?: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

function paymentBehaviorLabel(behavior: PaymentMethodBehavior) {
  switch (behavior) {
    case PaymentMethodBehavior.PIX:
      return "Pix";
    case PaymentMethodBehavior.DEBITO:
      return "Débito";
    case PaymentMethodBehavior.CREDITO_A_VISTA:
      return "Crédito à vista";
    case PaymentMethodBehavior.CREDITO_PARCELADO:
      return "Crédito parcelado";
    case PaymentMethodBehavior.DINHEIRO:
      return "Dinheiro";
    case PaymentMethodBehavior.TRANSFERENCIA:
      return "Transferência";
    case PaymentMethodBehavior.BOLETO:
      return "Boleto";
    default:
      return "Outro";
  }
}

function paymentMethodLabel(paymentMethod: PaymentMethod) {
  switch (paymentMethod) {
    case PaymentMethod.PIX:
      return "Pix";
    case PaymentMethod.DEBIT:
      return "Débito";
    case PaymentMethod.CREDIT_SINGLE:
      return "Crédito à vista";
    case PaymentMethod.CREDIT_INSTALLMENT:
      return "Crédito parcelado";
    case PaymentMethod.CASH:
      return "Dinheiro";
    case PaymentMethod.BANK_TRANSFER:
      return "Transferência";
    case PaymentMethod.BOLETO:
      return "Boleto";
    default:
      return "Outro";
  }
}

export function PaymentMethodForm({
  initialValues,
  onCancel,
}: PaymentMethodFormProps) {
  const action = initialValues?.id ? updatePaymentMethodAction : createPaymentMethodAction;
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
            {initialValues?.id ? "Editar forma de pagamento" : "Adicionar forma de pagamento"}
          </h3>
          <p className="text-sm text-slate-500">
            Itens inativos saem dos novos lançamentos, mas continuam aparecendo no histórico.
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
            placeholder="Ex.: Pix"
          />
          <FieldError message={state.fieldErrors?.name?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Comportamento</span>
          <select
            name="behavior"
            defaultValue={initialValues?.behavior ?? PaymentMethodBehavior.PIX}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            {Object.values(PaymentMethodBehavior).map((behavior) => (
              <option key={behavior} value={behavior}>
                {paymentBehaviorLabel(behavior)}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.behavior?.[0]} />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Tipo interno</span>
          <select
            name="paymentMethod"
            defaultValue={initialValues?.paymentMethod ?? PaymentMethod.PIX}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            {Object.values(PaymentMethod).map((paymentMethod) => (
              <option key={paymentMethod} value={paymentMethod}>
                {paymentMethodLabel(paymentMethod)}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.paymentMethod?.[0]} />
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="requiresInstallments"
            defaultChecked={initialValues?.requiresInstallments ?? false}
            className="size-4 rounded"
          />
          Exige parcelamento
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="immediateSettlement"
            defaultChecked={initialValues?.immediateSettlement ?? false}
            className="size-4 rounded"
          />
          Liquidação imediata
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initialValues?.isActive ?? true}
            className="size-4 rounded"
          />
          Ativa
        </label>
      </div>

      <FieldError message={state.fieldErrors?.requiresInstallments?.[0]} />

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          {initialValues?.id ? "Salvar alterações" : "Criar forma de pagamento"}
        </button>
      </div>
    </form>
  );
}
