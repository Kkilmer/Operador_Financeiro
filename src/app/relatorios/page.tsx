import { ReportAccounts } from "@/features/relatorios/components/report-accounts";
import { ReportEvolutionChart } from "@/features/relatorios/components/report-evolution-chart";
import { ReportExportButtons } from "@/features/relatorios/components/report-export-buttons";
import { ReportFilters } from "@/features/relatorios/components/report-filters";
import { ReportInstallments } from "@/features/relatorios/components/report-installments";
import { ReportPaymentMethods } from "@/features/relatorios/components/report-payment-methods";
import { ReportRankingTable } from "@/features/relatorios/components/report-ranking-table";
import { ReportSummaryCards } from "@/features/relatorios/components/report-summary-cards";
import { ReportUserBreakdown } from "@/features/relatorios/components/report-user-breakdown";
import { getFinancialReport } from "@/features/relatorios/services/get-financial-report";
import { ReportQueryParams } from "@/features/relatorios/types/report.types";
import { formatReportDateTime } from "@/features/relatorios/utils/report-formatters";
import { buildReportQueryString } from "@/features/relatorios/utils/report-query";

type ReportsPageProps = {
  searchParams?: Promise<ReportQueryParams>;
};

function buildExportHref(path: string, query: ReportQueryParams) {
  const queryString = buildReportQueryString(query);
  return queryString ? `${path}?${queryString}` : path;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const query = searchParams ? await searchParams : {};
  const report = await getFinancialReport(query);
  const csvHref = buildExportHref("/relatorios/exportar/csv", query);

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl bg-ink-950 p-6 text-white shadow-panel md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Relatórios</p>
          <h1 className="mt-3 text-3xl font-semibold">Relatório financeiro</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Analise entradas, saídas, parcelas, rankings e evolução financeira com segurança por usuário.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Período: {report.period.label}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Escopo: {report.scope.label}
            </span>
            <span className="rounded-full border border-slate-700 px-3 py-1">
              Gerado em {formatReportDateTime(report.generatedAt)}
            </span>
          </div>
        </div>

        <ReportExportButtons csvHref={csvHref} />
      </section>

      {report.period.warning || report.scope.warning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {report.period.warning ?? report.scope.warning}
        </div>
      ) : null}

      <ReportFilters
        query={query}
        scope={report.scope}
        availableUsers={report.availableUsers}
        isAdmin={report.currentUser.role === "ADMIN"}
      />

      <ReportSummaryCards summary={report.summary} />

      <ReportEvolutionChart data={report.evolution} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportRankingTable
          title="Ranking de categorias"
          description="Top 10 categorias com maior gasto no período."
          rows={report.categoryRanking}
        />
        <ReportRankingTable
          title="Ranking por titular"
          description="Top 10 pessoas/titulares com maior gasto no período."
          rows={report.personRanking}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReportPaymentMethods rows={report.paymentMethods} />
        <ReportAccounts rows={report.accounts} />
      </div>

      <ReportInstallments installments={report.installments} />
      <ReportUserBreakdown rows={report.userBreakdown} />
    </main>
  );
}
