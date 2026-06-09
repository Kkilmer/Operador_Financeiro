import { ReportSummary } from "@/features/relatorios/types/report.types";
import { formatCurrency } from "@/lib/utils/currency";

type SummaryCard = {
  label: string;
  value: string;
  description: string;
  tone?: "default" | "green" | "red" | "blue";
};

function getToneClassName(tone: SummaryCard["tone"]) {
  switch (tone) {
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "red":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "blue":
      return "border-sky-200 bg-sky-50 text-sky-900";
    default:
      return "border-slate-200 bg-white text-slate-900";
  }
}

export function ReportSummaryCards({ summary }: { summary: ReportSummary }) {
  const cards: SummaryCard[] = [
    {
      label: "Saldo inicial",
      value: formatCurrency(summary.initialBalance),
      description: "Saldo acumulado antes do período.",
    },
    {
      label: "Saldo final",
      value: formatCurrency(summary.finalBalance),
      description: "Saldo após o resultado líquido.",
      tone: summary.finalBalance >= 0 ? "green" : "red",
    },
    {
      label: "Entradas",
      value: formatCurrency(summary.income),
      description: "Total de entradas no período.",
      tone: "green",
    },
    {
      label: "Saídas",
      value: formatCurrency(summary.expense),
      description: "Total de saídas no período.",
      tone: "red",
    },
    {
      label: "Dinheiro guardado",
      value: formatCurrency(summary.saved),
      description: "Valores separados para reserva.",
      tone: "blue",
    },
    {
      label: "Resultado líquido",
      value: formatCurrency(summary.netResult),
      description: "Entradas menos saídas e guardado.",
      tone: summary.netResult >= 0 ? "green" : "red",
    },
    {
      label: "Parcelas",
      value: String(summary.installmentsTotal),
      description: `${summary.installmentsSettled} pagas e ${summary.installmentsPending} pendentes.`,
    },
    {
      label: "Lançamentos",
      value: String(summary.entryCount),
      description: "Quantidade de movimentações no período.",
    },
    {
      label: "Maior categoria",
      value: summary.topCategoryName ?? "Sem dados",
      description: "Categoria com maior gasto.",
    },
    {
      label: "Maior titular",
      value: summary.topPersonName ?? "Sem dados",
      description: "Pessoa com maior gasto.",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`rounded-3xl border p-5 shadow-sm ${getToneClassName(card.tone)}`}
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-70">{card.label}</p>
          <p className="mt-3 text-2xl font-semibold">{card.value}</p>
          <p className="mt-2 text-sm opacity-75">{card.description}</p>
        </article>
      ))}
    </section>
  );
}
