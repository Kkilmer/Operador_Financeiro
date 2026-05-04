import Link from "next/link";
import { EntryType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { MonthFilterForm } from "@/features/dashboard/components/month-filter-form";
import { EntryStatusCell } from "@/features/lancamentos/components/entry-status-cell";
import { listFinancialEntries } from "@/features/lancamentos/services/list-financial-entries";
import {
  getEntryTypePresentation,
  getPaymentMethodLabel,
} from "@/features/lancamentos/utils/financial-entry-presentations";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";

type FinancialEntriesPageProps = {
  searchParams?: Promise<{
    month?: string;
    status?: string;
  }>;
};

export default async function FinancialEntriesPage({ searchParams }: FinancialEntriesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedMonth =
    params?.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [entries] = await Promise.all([listFinancialEntries(selectedMonth)]);
  const status = params?.status;
  const [year, month] = selectedMonth.split("-").map(Number);
  const referenceDate = new Date(year, month - 1, 1);

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Lançamentos</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{formatMonthYear(referenceDate)}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Veja entradas, saídas, valores guardados e parcelas do mês selecionado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MonthFilterForm selectedMonth={selectedMonth} />
          <Link
            href="/lancamentos/novo"
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
          >
            Novo lançamento
          </Link>
        </div>
      </section>

      {status === "created" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Pronto! Seu lançamento foi salvo e já entrou nas movimentações do mês.
        </div>
      ) : status === "updated" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Pronto! O lançamento foi atualizado.
        </div>
      ) : null}

      <SectionCard
        title="Movimentações do mês"
        description="A listagem respeita o mês escolhido para você consultar qualquer período com movimentação."
      >
        {entries.length === 0 ? (
          <EmptyState
            title="Nenhuma movimentação neste mês"
            description="Quando houver entradas, saídas, valores guardados ou parcelas no mês selecionado, eles aparecerão aqui com pessoa, conta e categoria."
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
                  <th className="py-3 pr-4 font-medium">Ações</th>
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
                            {entry.isInstallment ? (
                              <Badge tone="amber">Compra parcelada</Badge>
                            ) : null}
                            {entry.type === EntryType.EXPENSE && entry.frequencyProfile === "FIXED" ? (
                              <Badge tone="emerald">Fixo</Badge>
                            ) : null}
                            {entry.type === EntryType.EXPENSE ? (
                              <Badge tone="slate">{getPaymentMethodLabel(entry.paymentMethod)}</Badge>
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
                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/lancamentos/${entry.id}/editar`}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </Link>
                          <span
                            title="Para preservar seu histórico, a remoção segura será feita em uma próxima etapa com soft delete."
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-400"
                          >
                            Remover
                          </span>
                        </div>
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
