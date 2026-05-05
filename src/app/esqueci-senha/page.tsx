import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  if (user && !user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operador Financeiro</p>
          <h1 className="text-3xl font-semibold text-slate-900">Esqueci minha senha</h1>
          <p className="text-sm text-slate-500">
            Para redefinir sua senha, solicite um link temporário ao administrador.
          </p>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-700">
            Como este projeto não tem envio automático de e-mail configurado, a redefinição de senha
            é feita apenas pelo Admin. Ele gera um link temporário, envia manualmente para você e o
            link expira em 30 minutos.
          </p>
          <p className="text-sm leading-6 text-slate-700">
            Caso você ainda tenha outro canal de contato com o Admin, peça um novo link de acesso.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/entrar"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            Voltar para entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
