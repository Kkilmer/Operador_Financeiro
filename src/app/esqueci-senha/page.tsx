import { redirect } from "next/navigation";

import { requestPasswordResetAction } from "@/features/auth/actions/request-password-reset";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { CpfInput } from "@/features/auth/components/cpf-input";
import { AuthFormState } from "@/features/auth/types/auth-form-state";
import { getCurrentUser } from "@/lib/auth/session";

const initialState: AuthFormState = {
  success: false,
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  if (user && !user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <AuthFormShell
      title="Esqueci minha senha"
      description="Informe seu CPF para validar o acesso e seguir com a redefinicao de senha."
      footerText="Lembrou sua senha?"
      footerHref="/entrar"
      footerLinkLabel="Entrar"
      action={requestPasswordResetAction}
      initialState={initialState}
      submitLabel="Continuar"
      pendingLabel="Validando..."
      fields={
        <CpfInput
          name="cpf"
          label="CPF"
          helperText="Para sua seguranca, so seguimos se os dados puderem ser validados."
        />
      }
    />
  );
}
