import Link from "next/link";

import { logoutAction } from "@/features/auth/actions/logout";

type TopbarProps = {
  userName: string;
};

export function Topbar({ userName }: TopbarProps) {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3 shadow-panel">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">MVP</p>
        <p className="text-sm text-slate-600">Lançamentos rápidos, parcelas e resumo mensal</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600 sm:inline-flex">
          {userName}
        </span>
        <Link
          href="/lancamentos"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Ver lançamentos
        </Link>
        <Link
          href="/lancamentos/novo"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          Novo lançamento
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
