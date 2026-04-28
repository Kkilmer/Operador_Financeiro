"use client";

import { EntryType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { DashboardRecentEntry } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type RecentTransactionsProps = {
  items: DashboardRecentEntry[];
};

export function RecentTransactions({ items }: RecentTransactionsProps) {
  function getEntryPresentation(type: EntryType) {
    switch (type) {
      case EntryType.INCOME:
        return {
          label: "Entrada",
          tone: "emerald" as const,
          amountClassName: "text-emerald-600",
          prefix: "+",
        };
      case EntryType.SAVED:
        return {
          label: "Guardado",
          tone: "sky" as const,
          amountClassName: "text-sky-600",
          prefix: "",
        };
      default:
        return {
          label: "Saída",
          tone: "slate" as const,
          amountClassName: "text-rose-600",
          prefix: "-",
        };
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-950">Últimos lançamentos</p>
        <p className="mt-1 text-sm text-slate-500">Um resumo rápido do que entrou, saiu ou foi guardado.</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Nenhum lançamento recente neste mês.
          </div>
        ) : (
          items.map((item) => {
            const presentation = getEntryPresentation(item.type);

            return (
              <article key={item.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-medium text-slate-900">{item.description}</h3>
                      <Badge tone={presentation.tone}>{presentation.label}</Badge>
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
                  <p className={`shrink-0 text-base font-semibold ${presentation.amountClassName}`}>
                    {presentation.prefix ? `${presentation.prefix} ` : ""}
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
