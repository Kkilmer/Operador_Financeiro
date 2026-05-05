import { redirect } from "next/navigation";

import { registerAction } from "@/features/auth/actions/login";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { CpfInput } from "@/features/auth/components/cpf-input";
import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { getCurrentUser } from "@/lib/auth/session";

const initialState: AuthFormState = {
  success: false,
};

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthFormShell
      title="Criar conta"
      description="Crie seu espaço privado para controlar suas finanças."
      footerText="Já tem conta?"
      footerHref="/entrar"
      footerLinkLabel="Entrar"
      action={registerAction}
      initialState={initialState}
      submitLabel="Criar conta"
      fields={
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input name="name" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">E-mail</span>
            <input name="email" type="email" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
          </label>

          <CpfInput name="cpf" label="CPF" />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Senha</span>
            <input
              name="password"
              type="password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Confirmar senha</span>
            <input
              name="confirmPassword"
              type="password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
        </>
      }
    />
  );
}
