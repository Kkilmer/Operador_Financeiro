import Link from "next/link";

export function Topbar() {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-white px-4 py-3 shadow-panel">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">MVP</p>
        <p className="text-sm text-slate-600">Lancamentos rapidos, parcelas e resumo mensal</p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/lancamentos"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Ver lancamentos
        </Link>
        <Link
          href="/lancamentos/novo"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          Novo lancamento
        </Link>
      </div>
    </div>
  );
}
