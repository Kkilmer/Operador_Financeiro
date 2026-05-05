import { redirect } from "next/navigation";

import { loginAction } from "@/features/auth/actions/login";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthFormShell
      title="Entrar"
      description="Acesse seu ambiente financeiro com privacidade."
      footerText="Ainda não tem conta?"
      footerHref="/cadastro"
      footerLinkLabel="Criar conta"
      action={loginAction}
      submitLabel="Entrar"
      fields={
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">E-mail</span>
            <input
              name="email"
              type="email"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="voce@exemplo.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Senha</span>
            <input
              name="password"
              type="password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
              placeholder="Sua senha"
            />
          </label>
        </>
      }
    />
  );
}
