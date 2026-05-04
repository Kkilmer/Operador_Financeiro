import { SectionCard } from "@/components/ui/section-card";
import { DashboardCategoryExpenseItem } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type CategoryExpensesChartProps = {
  items: DashboardCategoryExpenseItem[];
};

function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

export function CategoryExpensesChart({ items }: CategoryExpensesChartProps) {
  const topCategory = items[0] ?? null;
  const totalExpense = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <SectionCard
      title="Gastos por categoria"
      description="Veja quais categorias tiveram maior peso nas saídas do mês."
    >
      {items.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Nenhum gasto registrado neste mês.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {topCategory ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">Maior gasto</p>
                <p className="mt-2 truncate text-base font-semibold text-emerald-950">{topCategory.label}</p>
                <p className="mt-1 text-sm text-emerald-700">
                  {formatCurrency(topCategory.total)} ({formatPercentage(topCategory.percentage)}%)
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Total das saídas</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{formatCurrency(totalExpense)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3"
                title={`${item.label} — ${formatCurrency(item.total)} — ${formatPercentage(item.percentage)}%`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{item.label}</p>
                    <p className="truncate text-sm text-slate-500">{formatCurrency(item.total)}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-700">{formatPercentage(item.percentage)}%</p>
                  <p className="text-xs text-slate-400">do total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
