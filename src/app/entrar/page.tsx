import { redirect } from "next/navigation";
import Link from "next/link";

import { loginAction } from "@/features/auth/actions/login";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { PasswordField } from "@/features/auth/components/password-field";
import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { getCurrentUser } from "@/lib/auth/session";

const initialState: AuthFormState = {
  success: false,
};

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
      initialState={initialState}
      submitLabel="Entrar"
      fields={
        <>
          <AuthTextField
            name="email"
            type="email"
            label="E-mail"
            placeholder="seu.email@exemplo.com"
            autoComplete="email"
          />

          <PasswordField
            name="password"
            label="Senha"
            placeholder="Sua senha"
            autoComplete="current-password"
          />

          <div className="text-right">
            <Link
              href="/esqueci-senha"
              className="text-sm font-medium text-brand-700 transition hover:text-brand-600"
            >
              Esqueci minha senha
            </Link>
          </div>
        </>
      }
    />
  );
}
