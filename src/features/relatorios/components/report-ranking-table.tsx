import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { ReportRankingRow } from "@/features/relatorios/types/report.types";
import { formatCurrency } from "@/lib/utils/currency";

export function ReportRankingTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: ReportRankingRow[];
}) {
  return (
    <SectionCard title={title} description={description}>
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum gasto encontrado"
          description="Quando houver saídas no período, os maiores gastos aparecerão aqui."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4 font-medium">Nome</th>
                <th className="py-3 pr-4 font-medium">Valor</th>
                <th className="py-3 pr-4 font-medium">Percentual</th>
                <th className="py-3 pr-4 font-medium">Qtd.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{row.label}</td>
                  <td className="py-3 pr-4 text-slate-700">{formatCurrency(row.total)}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.percentage.toFixed(1)}%</td>
                  <td className="py-3 pr-4 text-slate-700">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
