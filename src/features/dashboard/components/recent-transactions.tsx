import { Badge } from "@/components/ui/badge";
import { DashboardRecentEntry } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type RecentTransactionsProps = {
  items: DashboardRecentEntry[];
};

export function RecentTransactions({ items }: RecentTransactionsProps) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-950">Últimos lançamentos</p>
        <p className="mt-1 text-sm text-slate-500">Um resumo rápido do que entrou e saiu.</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Nenhum lançamento recente neste mês.
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-slate-50 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-medium text-slate-900">{item.description}</h3>
                    <Badge tone={item.type === "INCOME" ? "emerald" : "slate"}>
                      {item.type === "INCOME" ? "Entrada" : "Saída"}
                    </Badge>
                  </div>
                  <div className="mt-1 space-y-1 text-sm text-slate-500">
                    <p>
                      {item.personName} • {item.accountName}
                    </p>
                    <p>
                      {item.categoryName ?? "Sem categoria"} • {item.eventDateLabel}
                    </p>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-base font-semibold ${
                    item.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {item.type === "INCOME" ? "+" : "-"} {formatCurrency(item.amount)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
