"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  UpdateSupportTicketState,
  updateSupportTicketAction,
} from "@/features/support/actions/update-support-ticket";
import { supportTicketStatusOptions } from "@/features/support/constants";
import { SubmitButton } from "@/features/lancamentos/components/submit-button";

const initialState: UpdateSupportTicketState = {
  success: false,
};

type AdminSupportTicketRowActionsProps = {
  ticketId: string;
  status: string;
  adminResponse: string | null;
};

export function AdminSupportTicketRowActions({
  ticketId,
  status,
  adminResponse,
}: AdminSupportTicketRowActionsProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateSupportTicketAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />

      <select
        name="status"
        defaultValue={status}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700"
      >
        {supportTicketStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <textarea
        name="adminResponse"
        rows={3}
        defaultValue={adminResponse ?? ""}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700"
        placeholder="Resposta opcional para o usuário"
      />

      <SubmitButton label="Salvar" pendingLabel="Salvando..." className="justify-center px-3 py-2 text-xs" />

      {state.message ? (
        <p className={`text-xs ${state.success ? "text-emerald-700" : "text-rose-700"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
