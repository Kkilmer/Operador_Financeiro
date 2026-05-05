import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { completePasswordResetAction } from "@/features/auth/actions/complete-password-reset";
import { PasswordField } from "@/features/auth/components/password-field";
import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const initialState: AuthFormState = {
  success: false,
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const user = await getCurrentUser();

  if (user && !user.mustChangePassword) {
    redirect("/dashboard");
  }

  const { token } = await searchParams;

  if (!token) {
    redirect("/entrar");
  }

  return (
    <AuthFormShell
      title="Redefinir senha"
      description="Escolha uma nova senha para recuperar seu acesso com segurança."
      footerText="Lembrou sua senha?"
      footerHref="/entrar"
      footerLinkLabel="Entrar"
      action={completePasswordResetAction}
      initialState={initialState}
      submitLabel="Salvar nova senha"
      pendingLabel="Salvando..."
      fields={
        <>
          <input type="hidden" name="token" value={token} />

          <PasswordField
            name="password"
            label="Nova senha"
            helperText="A senha deve ter no mínimo 8 caracteres."
            showStrengthMeter
            autoComplete="new-password"
          />

          <PasswordField
            name="confirmPassword"
            label="Confirmar nova senha"
            autoComplete="new-password"
          />
        </>
      }
    />
  );
}
