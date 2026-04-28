import Link from "next/link";

import { DashboardInstallmentPreview } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type InstallmentsCardProps = {
  totalInstallments: number;
  items: DashboardInstallmentPreview[];
};

export function InstallmentsCard({
  totalInstallments,
  items,
}: InstallmentsCardProps) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-950">Parcelas do mês</p>
          <p className="mt-1 text-sm text-slate-500">Compromissos que já pesam no mês atual.</p>
        </div>
        <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalInstallments)}</p>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Nenhuma parcela para este mês.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.cardName}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.installmentLabel}</p>
                </div>
                <p className="text-base font-semibold text-slate-900">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <Link
        href="/parcelas"
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-slate-100 px-4 text-sm font-medium text-slate-700"
      >
        Ver mais
      </Link>
    </section>
  );
}
