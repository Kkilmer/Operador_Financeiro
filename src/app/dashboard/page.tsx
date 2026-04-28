import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { SummaryCard } from "@/components/ui/summary-card";
import { BalanceCard } from "@/features/dashboard/components/balance-card";
import { InstallmentsCard } from "@/features/dashboard/components/installments-card";
import { MonthFilterForm } from "@/features/dashboard/components/month-filter-form";
import { RecentTransactions } from "@/features/dashboard/components/recent-transactions";
import { getDashboardSummary } from "@/features/dashboard/services/get-dashboard-summary";

type DashboardPageProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const summary = await getDashboardSummary(params?.month);

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-ink-950 px-6 py-6 text-white xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Home</p>
          <h1 className="mt-2 text-3xl font-semibold">Resumo do mês</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Veja rapidamente saldo, entradas, saídas, parcelas do mês e os últimos lançamentos.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <MonthFilterForm selectedMonth={summary.referenceMonth} dark />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/lancamentos/novo"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Novo lançamento
            </Link>
            <Link
              href="/lancamentos"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900"
            >
              Ver lançamentos
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr,0.65fr]">
        <BalanceCard value={summary.balance} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <SummaryCard label="Entradas do mês" value={summary.totalIncome} tone="positive" />
          <SummaryCard label="Saídas do mês" value={summary.totalExpense} tone="negative" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <InstallmentsCard
          totalInstallments={summary.totalInstallments}
          items={summary.installmentsPreview}
        />

        <SectionCard
          title="Últimos lançamentos"
          description="Os registros mais recentes do mês filtrado."
        >
          {summary.recentEntries.length === 0 ? (
            <EmptyState
              title="Nenhum lançamento neste mês"
              description="Crie o primeiro lançamento para começar a acompanhar seu resumo financeiro."
              ctaHref="/lancamentos/novo"
              ctaLabel="Criar lançamento"
            />
          ) : (
            <RecentTransactions items={summary.recentEntries} />
          )}
        </SectionCard>
      </section>
    </main>
  );
}
