import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

type BalanceCardProps = {
  value: number;
};

export function BalanceCard({ value }: BalanceCardProps) {
  const positive = value >= 0;

  return (
    <section
      className={cn(
        "rounded-2xl border px-6 py-6 shadow-sm",
        positive ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
      )}
    >
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Saldo do mes</p>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight lg:text-4xl",
          positive ? "text-emerald-700" : "text-rose-700",
        )}
      >
        {formatCurrency(value)}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {positive ? "Voce ainda esta no positivo." : "Seu mes esta negativo ate agora."}
      </p>
    </section>
  );
}
