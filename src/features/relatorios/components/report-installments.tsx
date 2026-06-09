import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { FinancialReport } from "@/features/relatorios/types/report.types";
import { formatCurrency } from "@/lib/utils/currency";

export function ReportInstallments({ installments }: { installments: FinancialReport["installments"] }) {
  return (
    <SectionCard
      title="Parcelas"
      description="Resumo das parcelas do período, usando os dados persistidos de cada compra parcelada."
    >
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total parcelado</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(installments.totalAmount)}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Pago</p>
          <p className="mt-2 text-xl font-semibold text-emerald-900">
            {formatCurrency(installments.settledAmount)}
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Pendente</p>
          <p className="mt-2 text-xl font-semibold text-amber-900">
            {formatCurrency(installments.pendingAmount)}
          </p>
        </div>
      </div>

      {installments.purchases.length === 0 ? (
        <EmptyState
          title="Nenhuma parcela no período"
          description="Compras parceladas aparecerão aqui quando houver parcelas dentro do período selecionado."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4 font-medium">Compra</th>
                <th className="py-3 pr-4 font-medium">Conta</th>
                <th className="py-3 pr-4 font-medium">Categoria</th>
                <th className="py-3 pr-4 font-medium">Parcelas no período</th>
                <th className="py-3 pr-4 font-medium">Valor</th>
                <th className="py-3 pr-4 font-medium">Pendente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {installments.purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{purchase.description}</td>
                  <td className="py-3 pr-4 text-slate-700">{purchase.accountName}</td>
                  <td className="py-3 pr-4 text-slate-700">{purchase.categoryName}</td>
                  <td className="py-3 pr-4 text-slate-700">
                    {purchase.installmentsInPeriod}/{purchase.installmentCount}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{formatCurrency(purchase.amountInPeriod)}</td>
                  <td className="py-3 pr-4 text-slate-700">{formatCurrency(purchase.pendingAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
