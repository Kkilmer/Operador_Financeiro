import { SectionCard } from "@/components/ui/section-card";
import { DashboardPersonRankingItem } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type PersonSpendingRankingCardProps = {
  items: DashboardPersonRankingItem[];
};

function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

export function PersonSpendingRankingCard({ items }: PersonSpendingRankingCardProps) {
  return (
    <SectionCard
      title="Ranking de gastos por pessoa"
      description="Mostra quem concentrou mais saídas no mês filtrado, sem considerar entradas, valores guardados ou transferências."
    >
      {items.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Nenhum gasto por pessoa neste mês.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                  {item.position}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{formatCurrency(item.total)}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-700">{formatPercentage(item.percentage)}%</p>
                <p className="text-xs text-slate-400">das saídas</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
