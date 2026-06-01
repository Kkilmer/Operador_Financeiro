"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  createSupportTicketAction,
  SupportTicketFormState,
} from "@/features/support/actions/create-support-ticket";
import { supportTicketTypeOptions } from "@/features/support/constants";
import { SubmitButton } from "@/features/lancamentos/components/submit-button";

const initialState: SupportTicketFormState = {
  success: false,
};

export function SupportTicketForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createSupportTicketAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Nova solicitação</h2>
        <p className="text-sm text-slate-600">
          Envie uma melhoria, um bug ou uma mensagem direta para o administrador.
        </p>
      </div>

      <form ref={formRef} action={formAction} className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Tipo</span>
          <select
            name="type"
            defaultValue={supportTicketTypeOptions[0].value}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          >
            {supportTicketTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Descrição</span>
          <textarea
            name="description"
            rows={5}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="Conte o que aconteceu ou o que você gostaria de melhorar."
          />
        </label>

        {state.message ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              state.success
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <SubmitButton label="Enviar solicitação" pendingLabel="Enviando..." className="w-full justify-center md:w-auto" />
      </form>
    </section>
  );
}
