import { redirect } from "next/navigation";

import { registerAction } from "@/features/auth/actions/login";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { CpfInput } from "@/features/auth/components/cpf-input";
import { PasswordField } from "@/features/auth/components/password-field";
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
          <AuthTextField name="name" label="Nome" autoComplete="name" />

          <AuthTextField name="email" type="email" label="E-mail" autoComplete="email" />

          <CpfInput name="cpf" label="CPF" />

          <PasswordField
            name="password"
            label="Senha"
            helperText="A senha deve ter no mínimo 8 caracteres."
            showStrengthMeter
            autoComplete="new-password"
          />

          <PasswordField
            name="confirmPassword"
            label="Confirmar senha"
            autoComplete="new-password"
          />
        </>
      }
    />
  );
}
