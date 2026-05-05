"use client";

import Link from "next/link";

import { logoutAction } from "@/features/auth/actions/logout";

type TopbarProps = {
  userName: string;
  onOpenMenu?: () => void;
};

export function Topbar({ userName, onOpenMenu }: TopbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white px-4 py-3 shadow-panel">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={onOpenMenu}
          className="inline-flex size-11 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-50 lg:hidden"
        >
          ☰
        </button>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">MVP</p>
          <p className="truncate text-sm text-slate-600">Lançamentos rápidos, parcelas e resumo mensal</p>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
        <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600 sm:inline-flex">
          {userName}
        </span>
        <Link
          href="/lancamentos"
          className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
        >
          Ver lançamentos
        </Link>
        <Link
          href="/lancamentos/novo"
          className="inline-flex rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
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
