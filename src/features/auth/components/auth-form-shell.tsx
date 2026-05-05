"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { SubmitButton } from "@/features/lancamentos/components/submit-button";

type AuthFormShellProps = {
  title: string;
  description: string;
  footerText: string;
  footerHref: "/entrar" | "/cadastro";
  footerLinkLabel: string;
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  initialState: AuthFormState;
};

export function AuthFormShell({
  title,
  description,
  footerText,
  footerHref,
  footerLinkLabel,
  action,
  fields,
  submitLabel,
  pendingLabel,
  initialState,
}: AuthFormShellProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operador Financeiro</p>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          {fields}

          {state.message ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.message}
            </div>
          ) : null}

          <SubmitButton
            label={submitLabel}
            pendingLabel={pendingLabel ?? "Entrando..."}
            className="w-full justify-center"
          />
        </form>

        <p className="mt-4 text-sm text-slate-500">
          {footerText}{" "}
          <Link href={footerHref} className="font-medium text-brand-700 hover:text-brand-600">
            {footerLinkLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
