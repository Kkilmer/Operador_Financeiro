import Link from "next/link";
import { EntryType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { listFinancialEntries } from "@/features/lancamentos/services/list-financial-entries";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";

export default async function FinancialEntriesPage() {
  const entries = await listFinancialEntries();

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Lancamentos</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{formatMonthYear()}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Lista os lancamentos do mes atual com destaque para pessoa, conta e parcelamento.
          </p>
        </div>

        <Link
          href="/lancamentos/novo"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          Novo lancamento
        </Link>
      </section>

      <SectionCard
        title="Movimentacoes do mes"
        description="No MVP, a listagem ja abre no mes atual para reduzir cliques."
      >
        {entries.length === 0 ? (
          <EmptyState
            title="Sem movimentacoes ainda"
            description="Assim que voce registrar entradas e saidas, elas aparecerao aqui com as informacoes de pessoa, conta e categoria."
            ctaHref="/lancamentos/novo"
            ctaLabel="Criar lancamento"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-3 pr-4 font-medium">Descricao</th>
                  <th className="py-3 pr-4 font-medium">Pessoa</th>
                  <th className="py-3 pr-4 font-medium">Conta</th>
                  <th className="py-3 pr-4 font-medium">Categoria</th>
                  <th className="py-3 pr-4 font-medium">Tipo</th>
                  <th className="py-3 pr-4 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="align-top">
                    <td className="py-4 pr-4">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{entry.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.isInstallment ? <Badge tone="amber">Parcela</Badge> : null}
                          <Badge tone="slate">{entry.paymentMethod}</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-slate-700">{entry.person.name}</td>
                    <td className="py-4 pr-4 text-slate-700">{entry.account.name}</td>
                    <td className="py-4 pr-4 text-slate-700">{entry.category?.name ?? "Sem categoria"}</td>
                    <td className="py-4 pr-4">
                      <Badge tone={entry.type === EntryType.INCOME ? "emerald" : "slate"}>
                        {entry.type === EntryType.INCOME ? "Entrada" : "Saida"}
                      </Badge>
                    </td>
                    <td className="py-4 pr-0 font-semibold text-slate-900">
                      {formatCurrency(Number(entry.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </main>
  );
}
