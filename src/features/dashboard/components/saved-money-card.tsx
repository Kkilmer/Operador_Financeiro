import { DashboardSavedEntry } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type SavedMoneyCardProps = {
  totalSaved: number;
  items: DashboardSavedEntry[];
};

export function SavedMoneyCard({ totalSaved, items }: SavedMoneyCardProps) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-950">Dinheiro guardado</p>
          <p className="mt-1 text-sm text-slate-500">
            Valores separados para reserva, poupança ou investimento.
          </p>
        </div>
        <p className="text-lg font-semibold text-sky-700">{formatCurrency(totalSaved)}</p>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Nenhum valor guardado neste mês.
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{item.description}</p>
                  <div className="mt-1 space-y-1 text-sm text-slate-500">
                    <p>
                      {item.personName} • {item.accountName}
                    </p>
                    <p>
                      {item.destinationName ?? "Sem destino"} • {item.eventDateLabel}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-base font-semibold text-sky-700">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
