import { SummaryCard } from "@/components/ui/summary-card";

type SummaryCardsProps = {
  totalIncome: number;
  totalExpense: number;
};

export function SummaryCards({
  totalIncome,
  totalExpense,
}: SummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <SummaryCard label="Entradas" value={totalIncome} tone="positive" compact />
      <SummaryCard label="Saidas" value={totalExpense} tone="negative" compact />
    </section>
  );
}
