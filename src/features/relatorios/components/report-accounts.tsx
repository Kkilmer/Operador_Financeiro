import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { ReportAccountRow } from "@/features/relatorios/types/report.types";
import { formatCurrency } from "@/lib/utils/currency";

export function ReportAccounts({ rows }: { rows: ReportAccountRow[] }) {
  return (
    <SectionCard
      title="Contas e cartões"
      description="Contas e cartões com maior valor movimentado no período."
    >
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma conta movimentada"
          description="Quando houver movimentações no período, elas aparecerão agrupadas por conta ou cartão."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4 font-medium">Conta/Cartão</th>
                <th className="py-3 pr-4 font-medium">Valor movimentado</th>
                <th className="py-3 pr-4 font-medium">Qtd.</th>
                <th className="py-3 pr-4 font-medium">Total em parcelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{row.label}</td>
                  <td className="py-3 pr-4 text-slate-700">{formatCurrency(row.total)}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.count}</td>
                  <td className="py-3 pr-4 text-slate-700">{formatCurrency(row.installmentTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
