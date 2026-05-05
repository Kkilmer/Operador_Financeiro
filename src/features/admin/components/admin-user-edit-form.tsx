"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  UpdateUserProfileState,
  updateUserProfileAction,
} from "@/features/admin/actions/update-user-profile";
import { CpfInput } from "@/features/auth/components/cpf-input";
import { SubmitButton } from "@/features/lancamentos/components/submit-button";

const initialState: UpdateUserProfileState = {
  success: false,
};

type AdminUserEditFormProps = {
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string | null;
  };
};

export function AdminUserEditForm({ user }: AdminUserEditFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateUserProfileAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/admin/usuarios?status=updated");
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Editar usuário</h2>
        <p className="text-sm text-slate-600">
          Atualize os dados básicos do cadastro sem alterar senha, perfil ou status de acesso.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="userId" value={user.id} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <input
            name="name"
            defaultValue={user.name}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
          {state.fieldErrors?.name?.[0] ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.name[0]}</span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">E-mail</span>
          <input
            name="email"
            type="email"
            defaultValue={user.email}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
          {state.fieldErrors?.email?.[0] ? (
            <span className="text-xs text-rose-700">{state.fieldErrors.email[0]}</span>
          ) : null}
        </label>

        <div>
          <CpfInput name="cpf" label="CPF" defaultValue={user.cpf ?? ""} />
          {state.fieldErrors?.cpf?.[0] ? (
            <span className="mt-2 block text-xs text-rose-700">{state.fieldErrors.cpf[0]}</span>
          ) : null}
        </div>

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

        <div className="flex flex-col gap-3 sm:flex-row">
          <SubmitButton
            label="Salvar alterações"
            pendingLabel="Salvando..."
            className="justify-center"
          />
          <Link
            href="/admin/usuarios"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
