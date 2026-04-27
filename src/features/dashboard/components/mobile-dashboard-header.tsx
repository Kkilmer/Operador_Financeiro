import { formatMonthYear } from "@/lib/utils/date";

type MobileDashboardHeaderProps = {
  greetingName: string;
  referenceMonth: string;
};

export function MobileDashboardHeader({
  greetingName,
  referenceMonth,
}: MobileDashboardHeaderProps) {
  const monthDate = new Date(`${referenceMonth}-01T00:00:00`);

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-slate-100/95 px-4 pb-4 pt-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Ola, {greetingName}</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Seu resumo rapido</h1>
        </div>

        <form method="get">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Mes
            </span>
            <input
              type="month"
              name="month"
              defaultValue={referenceMonth}
              aria-label="Trocar mes"
              className="min-h-11 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm"
            />
          </label>
        </form>
      </div>

      <p className="mt-3 text-sm text-slate-500">{formatMonthYear(monthDate)}</p>
    </header>
  );
}
