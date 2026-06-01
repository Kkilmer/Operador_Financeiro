"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { removeFinancialEntryAction } from "@/features/lancamentos/actions/remove-financial-entry";
import { CreateFinancialEntryActionState } from "@/features/lancamentos/types/financial-entry-form.types";

type FinancialEntryRemoveButtonProps = {
  entryId: string;
  isInstallment: boolean;
};

const initialState: CreateFinancialEntryActionState = {
  success: false,
};

function RemoveButtonLabel() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Removendo..." : "Remover"}
    </button>
  );
}

export function FinancialEntryRemoveButton({
  entryId,
  isInstallment,
}: FinancialEntryRemoveButtonProps) {
  const [state, formAction] = useActionState(removeFinancialEntryAction, initialState);

  return (
    <form
      action={formAction}
      className="contents"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          isInstallment
            ? "Essa ação ocultará apenas esta parcela e manterá o histórico da compra parcelada. Deseja continuar?"
            : "Esse lançamento será ocultado da listagem, do dashboard e das parcelas, mas continuará preservado no histórico interno. Deseja continuar?",
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={entryId} />
      <RemoveButtonLabel />
      {state.message ? <p className="w-full text-xs text-rose-600">{state.message}</p> : null}
    </form>
  );
}
