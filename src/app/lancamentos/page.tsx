import Link from "next/link";
import { EntryType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { EntryStatusCell } from "@/features/lancamentos/components/entry-status-cell";
import { listFinancialEntries } from "@/features/lancamentos/services/list-financial-entries";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";

type FinancialEntriesPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

function getEntryTypePresentation(type: EntryType) {
  switch (type) {
    case EntryType.INCOME:
      return {
        label: "Entrada",
        tone: "emerald" as const,
        amountClassName: "text-emerald-700",
      };
    case EntryType.SAVED:
      return {
        label: "Guardado",
        tone: "sky" as const,
        amountClassName: "text-sky-700",
      };
    default:
      return {
        label: "Saída",
        tone: "slate" as const,
        amountClassName: "text-slate-900",
      };
  }
}

export default async function FinancialEntriesPage({ searchParams }: FinancialEntriesPageProps) {
  const entries = await listFinancialEntries();
  const params = searchParams ? await searchParams : undefined;
  const status = params?.status;

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Lançamentos</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{formatMonthYear()}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Lista os lançamentos do mês atual com destaque para pessoa, conta, parcelamento e valores guardados.
          </p>
        </div>

        <Link
          href="/lancamentos/novo"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          Novo lançamento
        </Link>
      </section>

      {status === "created" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Pronto! Seu lançamento foi salvo e já entrou nas movimentações do mês.
        </div>
      ) : null}

      <SectionCard
        title="Movimentações do mês"
        description="No MVP, a listagem já abre no mês atual para reduzir cliques."
      >
        {entries.length === 0 ? (
          <EmptyState
            title="Sem movimentações ainda"
            description="Assim que você registrar entradas, saídas ou valores guardados, eles aparecerão aqui com as informações de pessoa, conta e categoria."
            ctaHref="/lancamentos/novo"
            ctaLabel="Criar lançamento"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-3 pr-4 font-medium">Descrição</th>
                  <th className="py-3 pr-4 font-medium">Pessoa</th>
                  <th className="py-3 pr-4 font-medium">Conta</th>
                  <th className="py-3 pr-4 font-medium">Categoria</th>
                  <th className="py-3 pr-4 font-medium">Tipo</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const presentation = getEntryTypePresentation(entry.type);

                  return (
                    <tr key={entry.id} className="align-top">
                      <td className="py-4 pr-4">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{entry.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.isInstallment ? <Badge tone="amber">Parcela</Badge> : null}
                            {entry.type === EntryType.EXPENSE ? (
                              <Badge tone="slate">{entry.paymentMethod}</Badge>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">{entry.person.name}</td>
                      <td className="py-4 pr-4 text-slate-700">{entry.account.name}</td>
                      <td className="py-4 pr-4 text-slate-700">{entry.category?.name ?? "Sem categoria"}</td>
                      <td className="py-4 pr-4">
                        <Badge tone={presentation.tone}>{presentation.label}</Badge>
                      </td>
                      <td className="py-4 pr-4">
                        <EntryStatusCell
                          entryId={entry.id}
                          type={entry.type}
                          settlementStatus={entry.settlementStatus}
                        />
                      </td>
                      <td className={`py-4 pr-0 font-semibold ${presentation.amountClassName}`}>
                        {formatCurrency(Number(entry.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </main>
  );
}
