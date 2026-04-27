import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

type SummaryCardProps = {
  label: string;
  value: number;
  tone?: "neutral" | "positive" | "negative";
  compact?: boolean;
};

export function SummaryCard({
  label,
  value,
  tone = "neutral",
  compact = false,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        compact ? "p-4" : "p-5",
        tone === "positive" && "border-emerald-200 bg-emerald-50",
        tone === "negative" && "border-rose-200 bg-rose-50",
        tone === "neutral" && "border-slate-200 bg-slate-50",
      )}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className={cn("mt-2 font-semibold text-slate-900", compact ? "text-lg" : "text-2xl")}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}
