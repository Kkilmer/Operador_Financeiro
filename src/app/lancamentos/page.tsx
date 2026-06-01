import Link from "next/link";
import {
  EntryFrequencyProfile,
  EntryType,
  PaymentMethod,
  SettlementStatus,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { MonthFilterForm } from "@/features/dashboard/components/month-filter-form";
import { FinancialEntryFilters } from "@/features/lancamentos/components/financial-entry-filters";
import { FinancialEntryRemoveButton } from "@/features/lancamentos/components/financial-entry-remove-button";
import { EntryStatusCell } from "@/features/lancamentos/components/entry-status-cell";
import {
  FinancialEntryListFilters,
  listFinancialEntries,
} from "@/features/lancamentos/services/list-financial-entries";
import {
  getEntryTypePresentation,
  getPaymentMethodLabel,
} from "@/features/lancamentos/utils/financial-entry-presentations";
import { requireCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";

type FinancialEntriesPageProps = {
  searchParams?: Promise<{
    month?: string;
    status?: string;
    entryStatus?: string;
    type?: string;
    recurrence?: string;
    installment?: string;
    accountId?: string;
    paymentMethod?: string;
    categoryId?: string;
    personId?: string;
  }>;
};

function isEnumValue<T extends Record<string, string>>(enumObject: T, value?: string): value is T[keyof T] {
  return Boolean(value && Object.values(enumObject).includes(value));
}

function parseFilters(params?: Awaited<FinancialEntriesPageProps["searchParams"]>): FinancialEntryListFilters {
  return {
    settlementStatus: isEnumValue(SettlementStatus, params?.entryStatus)
      ? params.entryStatus
      : undefined,
    type: isEnumValue(EntryType, params?.type) ? params.type : undefined,
    recurrence: isEnumValue(EntryFrequencyProfile, params?.recurrence)
      ? params.recurrence
      : undefined,
    isInstallment:
      params?.installment === "parcelados"
        ? true
        : params?.installment === "nao-parcelados"
          ? false
          : undefined,
    accountId: params?.accountId || undefined,
    paymentMethod: isEnumValue(PaymentMethod, params?.paymentMethod)
      ? params.paymentMethod
      : undefined,
    categoryId: params?.categoryId || undefined,
    personId: params?.personId || undefined,
  };
}

function hasActiveFilters(filters: FinancialEntryListFilters) {
  return Object.values(filters).some((value) => value !== undefined && value !== "");
}

export default async function FinancialEntriesPage({ searchParams }: FinancialEntriesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const selectedMonth =
    params?.month && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const filters = parseFilters(params);
  const userId = await requireCurrentUserId();
  const [entries, people, accounts, categories, paymentMethods] = await Promise.all([
    listFinancialEntries(selectedMonth, filters),
    prisma.person.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.financialAccount.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        ownerPerson: {
          select: { name: true },
        },
      },
    }),
    prisma.category.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.paymentMethodOption.findMany({
      where: { userId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, paymentMethod: true },
    }),
  ]);
  const status = params?.status;
  const [year, month] = selectedMonth.split("-").map(Number);
  const referenceDate = new Date(year, month - 1, 1);
  const hasFilters = hasActiveFilters(filters);

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
      ) : status === "removed" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Pronto! O lançamento foi removido com segurança da sua visualização.
        </div>
      ) : null}

      <FinancialEntryFilters
        selectedMonth={selectedMonth}
        filters={filters}
        people={people.map((person) => ({
          id: person.id,
          label: person.name,
        }))}
        accounts={accounts.map((account) => ({
          id: account.id,
          label: account.ownerPerson ? `${account.name} - ${account.ownerPerson.name}` : account.name,
        }))}
        categories={categories.map((category) => ({
          id: category.id,
          label: category.name,
        }))}
        paymentMethods={paymentMethods.map((paymentMethod) => ({
          id: paymentMethod.id,
          label: paymentMethod.name,
          paymentMethod: paymentMethod.paymentMethod,
        }))}
      />

      <SectionCard
        title="Movimentações do mês"
        description="A listagem respeita o mês escolhido para você consultar qualquer período com movimentação."
      >
        {entries.length === 0 ? (
          <EmptyState
            title={hasFilters ? "Nenhuma movimentação encontrada" : "Nenhuma movimentação neste mês"}
            description={
              hasFilters
                ? "Nenhum lançamento combina com os filtros selecionados. Ajuste os filtros ou limpe a seleção para ver todos os registros do mês."
                : "Quando houver entradas, saídas, valores guardados ou parcelas no mês selecionado, eles aparecerão aqui com pessoa, conta e categoria."
            }
            ctaHref={hasFilters ? `/lancamentos?month=${selectedMonth}` : "/lancamentos/novo"}
            ctaLabel={hasFilters ? "Limpar filtros" : "Criar lançamento"}
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
                              <Badge tone="amber">
                                {entry.installment
                                  ? `${entry.installment.number}/${entry.installment.installmentPurchase.installmentCount}`
                                  : "Compra parcelada"}
                              </Badge>
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
                          <FinancialEntryRemoveButton
                            entryId={entry.id}
                            isInstallment={entry.isInstallment}
                          />
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
