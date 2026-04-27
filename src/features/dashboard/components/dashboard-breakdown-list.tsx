import { DashboardBreakdownItem } from "@/features/dashboard/types/dashboard.types";
import { formatCurrency } from "@/lib/utils/currency";

type DashboardBreakdownListProps = {
  items: DashboardBreakdownItem[];
  emptyMessage?: string;
};

export function DashboardBreakdownList({
  items,
  emptyMessage = "Nenhum dado encontrado para o periodo.",
}: DashboardBreakdownListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
        >
          <span className="font-medium text-slate-700">{item.label}</span>
          <span className="font-semibold text-slate-900">{formatCurrency(item.total)}</span>
        </div>
      ))}
    </div>
  );
}
