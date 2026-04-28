import { SectionCard } from "@/components/ui/section-card";
import { DashboardCategoryExpenseItem } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type CategoryExpensesChartProps = {
  items: DashboardCategoryExpenseItem[];
};

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

export function CategoryExpensesChart({ items }: CategoryExpensesChartProps) {
  const topCategory = items[0] ?? null;
  const totalExpense = items.reduce((sum, item) => sum + item.total, 0);
  let offset = 0;

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
        <div className="grid gap-6 lg:grid-cols-[220px,minmax(0,1fr)] lg:items-start">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4">
            <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90 md:h-44 md:w-44" aria-hidden="true">
              <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="16" />
              {items.map((item) => {
                const segment = (item.percentage / 100) * CIRCUMFERENCE;
                const currentOffset = offset;
                offset += segment;

                return (
                  <circle
                    key={item.label}
                    cx="60"
                    cy="60"
                    r={RADIUS}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="16"
                    strokeDasharray={`${segment} ${CIRCUMFERENCE - segment}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="butt"
                  >
                    <title>
                      {`${item.label} — ${formatCurrency(item.total)} — ${formatPercentage(item.percentage)}%`}
                    </title>
                  </circle>
                );
              })}
            </svg>

            <div className="-mt-24 text-center md:-mt-28">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Saídas</p>
              <p className="mt-2 text-lg font-semibold text-slate-950 md:text-xl">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            {topCategory ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm text-emerald-800">
                  <span className="font-semibold">Maior gasto:</span> {topCategory.label}
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  {formatCurrency(topCategory.total)} ({formatPercentage(topCategory.percentage)}%)
                </p>
              </div>
            ) : null}

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
        </div>
      )}
    </SectionCard>
  );
}
