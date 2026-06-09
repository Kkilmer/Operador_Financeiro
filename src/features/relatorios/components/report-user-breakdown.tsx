import { SectionCard } from "@/components/ui/section-card";
import { ReportUserBreakdownRow } from "@/features/relatorios/types/report.types";
import { formatCurrency } from "@/lib/utils/currency";

export function ReportUserBreakdown({ rows }: { rows: ReportUserBreakdownRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <SectionCard
      title="Consolidado por usuário"
      description="Visão administrativa agregada, sem expor dados financeiros privados além do necessário para o relatório."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-3 pr-4 font-medium">Usuário</th>
              <th className="py-3 pr-4 font-medium">Entradas</th>
              <th className="py-3 pr-4 font-medium">Saídas</th>
              <th className="py-3 pr-4 font-medium">Guardado</th>
              <th className="py-3 pr-4 font-medium">Resultado</th>
              <th className="py-3 pr-4 font-medium">Qtd.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.userId}>
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-900">{row.userName}</p>
                  <p className="text-xs text-slate-500">{row.userEmail}</p>
                </td>
                <td className="py-3 pr-4 text-slate-700">{formatCurrency(row.income)}</td>
                <td className="py-3 pr-4 text-slate-700">{formatCurrency(row.expense)}</td>
                <td className="py-3 pr-4 text-slate-700">{formatCurrency(row.saved)}</td>
                <td className="py-3 pr-4 text-slate-700">{formatCurrency(row.netResult)}</td>
                <td className="py-3 pr-4 text-slate-700">{row.entryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
