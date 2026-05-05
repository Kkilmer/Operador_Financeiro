import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { completePasswordResetAction } from "@/features/auth/actions/complete-password-reset";
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

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Nova senha</span>
            <input
              name="password"
              type="password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Confirmar nova senha</span>
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
